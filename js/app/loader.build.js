/* var exports = {}; */
var app_version = '{version}';
var cb = '?' + app_version;

$LAB
	.script('js/build/vendor.min.js' + cb).wait()
	.script('js/build/talon.min.js' + cb).wait()
	.script('js/build/app.min.js' + cb);
