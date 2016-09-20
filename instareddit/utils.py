import os

import praw
from django.core.exceptions import ImproperlyConfigured
from imgurpython import ImgurClient


def get_env_variable(var_name):
    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)


def get_reddit_instance():
    return praw.Reddit(
        user_agent='A reddit wrapper for pictures and videos made my /u/add7. Contact email novosel.rok@gmail.com',
        client_id=get_env_variable('REDDIT_CLIENT_ID'),
        client_secret=get_env_variable('REDDIT_CLIENT_SECRET'))


def get_imgur_instance():
    return ImgurClient(get_env_variable('IMGUR_CLIENT_ID'), get_env_variable('IMGUR_CLIENT_SECRET'))
