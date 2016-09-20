import random
from urllib.parse import urlsplit
import requests
from django.http import JsonResponse
from django.views import View
from imgurpython.helpers.error import ImgurClientError
from prawcore.exceptions import NotFound, Redirect

from instareddit.utils import get_reddit_instance, get_imgur_instance

WHITELISTED_URLS = [
    'imgur.com',
    'i.imgur.com',
    'gfycat.com',
    'streamable.com',
    'my.mixtape.moe',
    'i.reddituploads.com',
    'i.redd.it'
]

TEMPLATES = {
    "normal": "<div class='image'><img class='ui fluid image rounded' src='{}'></div>",
    "gfycat": "<div class='gfyitem' data-id='{}'></div>",
    "video": "<div style='width: 100%; height: 0px; position: relative; padding-bottom: 56%;'><video src='{}' frameborder='0' controls loop style='width: 100%; height: 100%; position: absolute;'></iframe></div>"
}


def only_image_and_video(submission):
    if submission.is_self:
        return False
    url = list(urlsplit(submission.url))
    return url[1] in WHITELISTED_URLS and "gallery" not in url[2] and url[2][:3] != "/a/"


def get_html(submission_url):
    url = urlsplit(submission_url)
    if "imgur.com" in url[1]:
        imgur_client = get_imgur_instance()
        imgur_id = url[2][1:].split(".")[0]
        try:
            image = imgur_client.get_image(imgur_id)
        except ImgurClientError:
            print("Imgur client error")
            return ""

        image_gifv = getattr(image, 'gifv', "")
        image_mp4 = getattr(image, 'mp4', "")

        if image_mp4:
            return TEMPLATES["video"].format(image_mp4)
        elif image_gifv:
            return TEMPLATES["video"].format(image_gifv)
        else:
            return TEMPLATES["normal"].format(image.link)
    elif "gfycat.com" in url[1]:
        return TEMPLATES["gfycat"].format(url[2][1:])
    elif "streamable.com" in url[1]:
        streamable_api = "https://api.streamable.com/oembed.json?url={}"
        r = requests.get(streamable_api.format(submission_url))
        return r.json()["html"]
    elif ".mp4" in url[2]:
        return TEMPLATES["video"].format(submission_url)
    else:
        return TEMPLATES["normal"].format(submission_url)


def submission_to_json(submission):
    return {
        'title': submission.title,
        'ups': submission.ups,
        'user': submission.author.name,
        'subreddit': submission.subreddit.display_name,
        'created': submission.created,
        'html': get_html(submission.url),
        'permalink': "https://reddit.com" + submission.permalink,
        'id': submission.id
    }


class InstaredditView(View):
    def get(self, request):
        r = get_reddit_instance()
        subreddit = request.GET['subreddit']

        try:
            submissions = r.subreddit(subreddit).hot(limit=25)
        except (NotFound, Redirect):
            print("Subreddit " + subreddit + " not found.")
            return JsonResponse({'error': "Subreddit " + subreddit + " not found."}, status=404)

        try:
            submissions = list(map(submission_to_json, list(filter(only_image_and_video, submissions))))
            return JsonResponse({"submissions": submissions}, safe=False)
        except Redirect:
            print("Subreddit " + subreddit + " not found.")
            return JsonResponse({'error': "Subreddit " + subreddit + " not found."}, status=404)
