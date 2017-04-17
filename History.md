
2.0.0 / 2017-04-16
==================

 * use express/send module to serve sprites
 * remove automatic config file creation
 * remove unused files docs, Dockerconfig etc.
 * fix lint issues
 * remove support for applying style (shrinking) tiles
 * remove support for serving geojson tiles
 * remove automatic downloading of example file
 * add test to ensure binary tile format
 * remove demo website
 * add linting and .jshint target
 * remove .png tiles rendering
 * change package name to @pirxpilot/tileserver-gl-tiny
 * add max-age parameter to configure Cache-Control
 * optimize range checking
 * use async version for gzip and gunzip
 * simplify serve_data code
 * add `--cors` option to allow for optional CORS handling
