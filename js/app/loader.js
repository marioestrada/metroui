/* var exports = {}; */
var app_version = '0.17.2';

if(app_version == '{version}')
{
	$LAB
		.script('js/vendor/jquery.min.js').wait()
		
		.script('js/vendor/jquery.mobile.min.js')
		//.script('js/vendor/jquery.mobile/jquery.mobile.support.js')
		//.script('js/vendor/jquery.mobile/jquery.mobile.vmouse.js')
		//.script('js/vendor/jquery.mobile/jquery.mobile.event.js')
	
		//.script('js/vendor/transformjs.js')
		.script('js/vendor/spine.js')
		.script('js/vendor/handlebars.min.js')
		
		.script('/static/js/lib/jquery.json.js' + cb)
		.script('/static/js/lib/common.js' + cb)
		.script('/static/js/lib/underscore.js' + cb).wait()
	
		.script('/static/js/srp/sjcl.js' + cb)
		.script('/static/js/srp/encryption.js' + cb)
		.script('/static/js/client/api.js' + cb)
		.script('/static/js/client/models.js' + cb)
		.script('/static/js/client/client.js' + cb)
		.script('/static/js/lib/jquery.jstorage.js' + cb)
		.script('/static/js/lib/jquery.cookie.js' + cb)
	
		.script('js/app/helpers.js' + cb)
		.script('js/app/controllers/torrents.js' + cb)
		.script('js/app/controllers/controls.js' + cb)
		.script('js/app/controllers/settings.js' + cb)
		.script('js/app/controllers/panels.js' + cb)
		.script('js/app/controllers/feeds.js' + cb)
		.script('js/app/controllers/sidebar.js' + cb)
		.script('js/app/models/torrent.js' + cb)
		.script('js/app/models/file.js' + cb)
		.script('js/app/models/peer.js' + cb)
		.script('js/app/models/feed.js' + cb)
		.script('js/app/models/feedtorrent.js' + cb).wait()
		.script('js/app/app.js' + cb);
}else{
	var cb = '?' + app_version;
	var ext = (window.location.href.indexOf('debug=1') > 0) ? '.js' : '.min.js';
	
	$LAB
		.script('js/build/vendor' + ext + cb).wait()
		.script('js/build/talon' + ext + cb).wait()
		.script('js/build/app' + ext + cb);
}
