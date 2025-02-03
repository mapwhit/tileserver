
3.6.0 / 2025-02-02
==================

 * generate `ETag` header unless `noETag` option is set
 * check response freshness for cache validation request

3.5.3 / 2025-02-01
==================

 * set Content-Length header for all responses

3.5.2 / 2025-01-31
==================

 * add bin alias `tileserver`

3.5.1 / 2025-01-31
==================

 * soft dependency update

3.5.0 / 2025-01-30
==================

 * rename to @mapwhit/tileserver

3.4.0 / 2025-01-28
==================

 * add support for server-timings
 * remove support for compressing tiles
 * remove ETag only if `removeETag` option is set

3.3.1 / 2025-01-27
==================

 * use createTileJSON to build all data responses
 * move all responsibility of determining the mount path up to a server
 * optimize `req.protocol` calculation
 * improve router mounting point
 * simplify `serveData` function

3.3.0 / 2025-01-26
==================

 * dependency upgrade
 * replace `router` with `@pirxpilot/router`

3.2.5 / 2024-12-25
==================

 * upgrade router to ~2

3.2.4 / 2024-12-10
==================

 * force path-to-regexp to 0.1.12
 * soft dependency update
 * normalize package.json

3.2.3 / 2024-10-07
==================

 * force path-to-regexp to 0.1.11
 * fix test runner invocation
 * upgrade supertest to ~7

3.2.2 / 2023-10-14
==================

 * upgrade @mapwhit/mbtiles to 1.1.0
 * replace mocha with native test runner

3.2.1 / 2023-02-10
==================

 * replace Travis CI with github actions
 * upgrade mocha to ~10
 * soft dependency update
 * upgrade @mapwhit/mbtiles

3.2.0 / 2021-07-14
==================

 * use @mapwhit/mbtiles
 * updgrade deps
 * remove unused `README_light`

3.1.0 / 2020-07-09
==================

 * update dependencies
 * update documentation
 * simplify config parsing
 * replace commander with rc

3.0.0 / 2019-09-08
==================

 * reorganize option parsing
 * use @pirxpilot/connect fork
 * rewrite in ES8
 * simplify getTileUrls
 * remove serving styles functionality
 * remove serving fonts functionality
 * remove CORS support
 * remove morgan
 * simplify testing config
 * update dependencies

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
