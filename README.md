&micro;Torrent and BitTorrent Touch UI (iPad and iPhone)
==========================

Touch UI for the remote &micro;Torrent and BitTorrent web app.

Build and Minify Javascript
===================

Requirements:

1. Install Node JS
1. Install NPM
1. `npm install jake`
1. `npm install node-minify`

Then just run `jake`.

Stylesheets
===========

The stylesheets are written using Less. They should be compiled, preferably with minifaction.

One way to minify it:

1. `npm install less`
2. `lessc --yui-compress css/app.less > css/app.css`