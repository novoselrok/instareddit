requirejs.config({
    baseUrl: 'static/js/vendor', // by default load any module IDs from js/vendor
    paths: {
        app: '../app', // except, if the module ID starts with "app"
        jquery: 'jquery-3.1.0.min'
    },
    shim: {
        'gfycat': {
            exports: 'gfyCollection'
        }
    }
});

// Start the main app logic.
requirejs(['jquery', 'vue.min', 'app/Instareddit'],
    function ($, Vue, Instareddit) {
        var hash = window.location.hash;
        if (hash) {
            var subreddits = hash.substring(1).split(',');
            Instareddit.go(subreddits);
        } else {
            Instareddit.go([]);
        }
    });