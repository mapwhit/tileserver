[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]

# @mapwhit/tileserver

This is a slimmed down clone of the [tileserver-gl] package.
It's intended to be used as a standalone server for tiles in [mbtiles] format.

The following features of the original are not supported:

- server side rasterization
- font server - if needed use [map-glyph-server]
- CORS support - if needed use behind NGINX or alternative

## Installation

```sh
npm install -g @mapwhit/tileserver-gl-tiny
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

[npm-image]: https://img.shields.io/npm/v/@mapwhit/tileserver
[npm-url]: https://npmjs.org/package/@mapwhit/tileserver

[build-image]: https://img.shields.io/github/actions/workflow/status/mapwhit/tileserver/check.yaml?branch=main
[build-url]: https://github.com/mapwhit/tileserver/actions/workflows/check.yaml

[deps-image]: https://img.shields.io/librariesio/release/npm/@mapwhit/tileserver
[deps-url]: https://libraries.io/npm/@mapwhit%2Ftileserver

