var fs = require('fs')

var talon_dir = "../talonstatic/"
var build_dir = "./js/build/"

var min_ext = '.min.js'
var concat_ext = '.js'

var files = {
    'vendor': [
        'js/vendor/jquery.js',
        'js/vendor/jquery.mobile.js',
        'js/vendor/spine.js',
        'js/vendor/handlebars.js'
    ],
    
    'talon': [
        talon_dir + '/static/js/lib/jquery.json.js',
        talon_dir + '/static/js/lib/common.js',
        talon_dir + '/static/js/lib/underscore.js',

        talon_dir + '/static/js/srp/sjcl.js',
        talon_dir + '/static/js/srp/encryption.js',
        talon_dir + '/static/js/client/api.js',
        talon_dir + '/static/js/client/models.js',
        talon_dir + '/static/js/client/client.js',
        talon_dir + '/static/js/lib/jquery.jstorage.js',
        talon_dir + '/static/js/lib/jquery.cookie.js'
    ],
    
    'app': [
        'js/app/helpers.js',
        'js/app/controllers/torrents.js',
        'js/app/controllers/controls.js',
        'js/app/controllers/settings.js',
        'js/app/controllers/panels.js',
        'js/app/controllers/feeds.js',
        'js/app/controllers/sidebar.js',
        'js/app/models/torrent.js',
        'js/app/models/file.js',
        'js/app/models/peer.js',
        'js/app/models/feed.js',
        'js/app/models/feedtorrent.js',
        'js/app/app.js'
    ]
}

desc('This is the default task.')
task('default', ['new-minify'], function (params)
{
    console.log('Running...')  
})

desc('Concatenate and minify source.')
task('new-minify', function (params)
{
    ['vendor', 'talon', 'app'].forEach(function(key)
    {
        new compressor.minify({
            type: 'gcc',
            fileIn: files[key],
            fileOut: build_dir + key + min_ext,
            callback: function(err)
            {
                console.log(err);
            }
        })
    })
    console.log('Done.')  
})