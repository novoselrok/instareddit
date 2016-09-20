define(['jquery', 'vue.min', 'vue-resource.min', 'gfycat'], function ($, Vue, VueResource, gfyCollection) {
    var go = function (subreddits) {
        console.log(subreddits);
        Vue.use(VueResource);
        var App = Vue.extend({
            template: '#app-template',
            components: {
                'card': {
                    template: '#card-template',
                    props: ['picture']
                },
                'subreddit-label': {
                    template: '#subreddit-label-template',
                    props: ['subreddit'],
                    methods: {
                        notify: function (e) {
                            var subreddit = $(e.target).attr('data-value');
                            this.$dispatch('child-msg', subreddit)
                        }
                    }
                }
            },
            data: function () {
                return {
                    pictures: [],
                    selectedSubreddits: [],
                    initialSubreddits: subreddits,
                    isLoading: false,
                    showBookmarkLink: false,
                    loadingSubreddits: []
                }
            },
            ready: function () {
                if (this.initialSubreddits.length > 0) {
                    // We were initialized with some subreddits
                    var that = this;
                    this.initialSubreddits.forEach(function (subreddit) {
                        that.getSubredditData(subreddit);
                    });
                }
            },
            computed: {
                subredditPresent: function () {
                    return this.selectedSubreddits.length > 0;
                },
                bookmarkLink: function () {
                    return window.location.href + "#" + this.selectedSubreddits.map(function (s) {
                            return s.name;
                        }).join();
                }
            },
            events: {
                'child-msg': function (subreddit) {
                    for (var i = 0; i < this.selectedSubreddits.length; i++) {
                        if (this.selectedSubreddits[i].name === subreddit) {
                            this.selectedSubreddits.$remove(this.selectedSubreddits[i]);
                        }
                    }

                    this.pictures = this.pictures.filter(function (o) {
                        return o.subreddit !== subreddit;
                    });
                }
            },
            methods: {
                getSubredditData: function (subreddit) {
                    var subredditLabel = {
                        name: subreddit,
                        loading: true
                    };
                    this.selectedSubreddits.push(subredditLabel);
                    var that = this;
                    this.$http.get("/subreddit-data/", {params: {subreddit: subreddit}})
                        .then(function (data) {
                            this.pictures = this.pictures.concat(data.data["submissions"]);
                            Vue.nextTick(gfyCollection.init);
                            subredditLabel.loading = false;
                        }, function (err) {
                            console.log(err);
                            subredditLabel.loading = false;
                            that.selectedSubreddits.$remove(subredditLabel);
                        });
                },
                addSubreddit: function () {
                    var inputField = $("#subreddit-input");
                    var subreddit = inputField.val().trim();
                    if (subreddit.length > 0 && this.selectedSubreddits.indexOf(subreddit) == -1) {
                        // Subreddit not present
                        this.getSubredditData(subreddit);
                    }
                    // Clear input field
                    inputField.val('');
                },
                reset: function (e) {
                    this.selectedSubreddits = [];
                    this.pictures = [];
                    this.showBookmarkLink = false;
                },
                toggleBookmarkLink: function (e) {
                    this.showBookmarkLink = ! this.showBookmarkLink;
                },
                shuffle: function (array) {
                    var counter = array.length;

                    // While there are elements in the array
                    while (counter > 0) {
                        // Pick a random index
                        var index = Math.floor(Math.random() * counter);

                        counter--;
                        // And swap the last element with it
                        var temp = array[counter];
                        array[counter] = array[index];
                        array[index] = temp;
                    }

                    return array;
                }
            }
        });

        Vue.component('app', App);
        new Vue({el: 'body'});
    };

    return {
        go: go
    }
});

