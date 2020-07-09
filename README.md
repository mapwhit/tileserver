[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][deps-image]][deps-url]
[![Dev Dependency Status][deps-dev-image]][deps-dev-url]

# TileServer GL Tiny

This is a slimmed down clone of the [tileserver-gl] package.
It's intended to be used as a standalone server for tiles in [mbtiles] format.

The following features of the original are not supported:

- server side rasterization
- font server - if needed use [map-glyph-server]
- CORS support - if needed use behind NGINX or alternative

## Installation

```sh
npm install -g @pirxpilot/tileserver-gl-tiny
```


You will also need [mbtiles]

## Usage

```sh
tileserver-gl-tiny --config path/to/config/file
```

Config file can be in `.json` or `yaml`. If config file name is not specified
`tilesrc` config file is located according to the rules describe in the [rc] project.

Config file example:

```ini
port = 5080
max-age = 10d

[options.paths]

; this is where .mbtiles files are located
root = /var/lib/tiles

[data.v3]

mbtiles = planet.mbtiles

; add more [data.xxx] section to serve additional .mbtiles
```

## Documentation

Most of the [tileserver-gl documentation] is relevant - specifically parts related to conig format.


[mbtiles]: https://wiki.openstreetmap.org/wiki/MBTiles
[tileserver-gl]: https://www.npmjs.com/package/tileserver-gl
[rc]: https://www.npmjs.com/package/rc
[tileserver-gl documentation]: http://tileserver.readthedocs.io
[map-glyph-server]: https://github.com/furkot/map-glyph-server

[npm-image]: https://img.shields.io/npm/v/@pirxpilot/tileserver-gl-tiny.svg
[npm-url]: https://npmjs.org/package/@pirxpilot/tileserver-gl-tiny

[travis-image]: https://img.shields.io/travis/com/pirxpilot/tileserver-gl.svg
[travis-url]: https://travis-ci.com/pirxpilot/tileserver-gl

[deps-image]: https://img.shields.io/david/pirxpilot/tileserver-gl.svg
[deps-url]: https://david-dm.org/pirxpilot/tileserver-gl

[deps-dev-image]: https://img.shields.io/david/dev/pirxpilot/tileserver-gl.svg
[deps-dev-url]: https://david-dm.org/pirxpilot/tileserver-gl?type=dev
