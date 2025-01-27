const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');

const Router = require('@pirxpilot/router');
const mbtiles = require('@mapwhit/mbtiles');

const { fixTileJSONCenter, getTileUrls } = require('./utils');
const gzip = promisify(zlib.gzip);

module.exports = serveData;

function serveData(mountPath, options, item) {
  const domains = item.domains || options.domains;
  const format = 'pbf';
  const suffix = options.pbfAlias ?? format;
  const tileJSON = {
    tilejson: '2.0.0',
    format
  };

  const filename = resolveFilename(options.paths.mbtiles, item.mbtiles);
  const source = new mbtiles(filename);
  const { filesize, mtime, scheme, tilejson, ...info } = source.getInfo();
  Object.assign(tileJSON, info, item.tilejson);
  fixTileJSONCenter(tileJSON);

  const zoomRanges = initZoomRanges(tileJSON.minzoom, tileJSON.maxzoom);

  const router = new Router();
  router.get(`/:z/:x/:y.${suffix}`, checkParams, getTile, zipTile, sendTile);
  router.get('/{.json}', sendData);
  return { router, data: tileJSON };

  function checkParams(req, res, next) {
    const z = req.params.z | 0;
    const x = req.params.x | 0;
    const y = req.params.y | 0;

    if (z < tileJSON.minzoom || z > tileJSON.maxzoom) {
      return next(404);
    }

    const max = zoomRanges[z];

    if (x < 0 || x >= max || y < 0 || y >= max) {
      return next(404);
    }

    req.params.z = z;
    req.params.x = x;
    req.params.y = y;

    next();
  }

  function getTile(req, res, next) {
    const { z, x, y } = req.params;
    const { tile: data, headers, error: err } = source.getTile(z, x, y);
    if (err) {
      const status = /does not exist/.test(err.message) ? 404 : 500;
      return res.writeHead(status, err.message).end();
    }
    if (data == null) {
      return next(404);
    }
    req.tile = {
      data,
      headers,
      contentType: 'application/x-protobuf',
      isGzipped: isGzipped(data)
    };
    next();
  }

  async function zipTile(req, res, next) {
    const { tile } = req;
    if (!tile.isGzipped) {
      tile.data = gzip(tile.data);
      tile.isGzipped = true;
    }
    next();
  }

  function sendTile(req, res) {
    const headers = req.tile.headers;

    delete headers['ETag']; // do not trust the tile ETag -- regenerate
    headers['Content-Type'] = req.tile.contentType;
    headers['Content-Encoding'] = 'gzip';
    if (req.cacheControl) {
      headers['Cache-Control'] = req.cacheControl;
    }

    res.setHeaders(new Headers(headers));
    res.end(req.tile.data);
  }

  function sendData(req, res) {
    const info = {
      ...tileJSON,
      tiles: getTileUrls(req, domains, mountPath, suffix)
    };
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(info));
  }
}

function resolveFilename(dir, name) {
  const filename = path.resolve(dir, name);
  const stats = fs.statSync(filename);
  if (!stats.isFile() || stats.size === 0) {
    throw Error(`Not valid MBTiles file: ${filename}`);
  }
  return filename;
}

function isGzipped(data) {
  return data[0] === 0x1f && data[1] === 0x8b;
}

function initZoomRanges(min, max) {
  const ranges = [];
  let value = 2 ** min;
  for (let i = min; i <= max; i++) {
    ranges[i] = value;
    value *= 2;
  }
  return ranges;
}
