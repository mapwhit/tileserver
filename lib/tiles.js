const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');

const Router = require('@pirxpilot/router');
const mbtiles = require('@mapwhit/mbtiles');

const { fixTileJSONCenter, getTileUrls } = require('./utils');
const gzip = promisify(zlib.gzip);

module.exports = serveData;

function serveData(options, repo, params, id) {
  const tileJSON = (repo[id] = {
    tiles: params.domains || options.domains,
    tilejson: '2.0.0',
    name: id,
    format: 'pbf'
  });

  const filename = resolveFilename(options.paths.mbtiles, params.mbtiles);
  const source = new mbtiles(filename);
  const { filesize, mtime, scheme, tilejson, ...info } = source.getInfo();
  Object.assign(tileJSON, info, params.tilejson);
  fixTileJSONCenter(tileJSON);

  const zoomRanges = initZoomRanges(tileJSON.minzoom, tileJSON.maxzoom);

  const router = new Router();
  router.get(`/${id}/:z/:x/:y.pbf`, checkParams, getTile, zipTile, sendTile);
  router.get(`/${id}.json`, sendData);
  return router;

  function checkParams(req, res, next) {
    const z = req.params.z | 0;
    const x = req.params.x | 0;
    const y = req.params.y | 0;

    if (
      z < tileJSON.minzoom ||
      z > tileJSON.maxzoom ||
      x < 0 ||
      x >= zoomRanges[z] ||
      y < 0 ||
      y >= zoomRanges[z]
    ) {
      return res.writeHead(404, 'Out of bounds').end();
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
      return res.writeHead(404, 'Not found').end();
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
    const { tiles, format, ...data } = tileJSON;
    const info = {
      ...data,
      tiles: getTileUrls(req, tiles, `data/${id}`, format, {
        pbf: options.pbfAlias
      }),
      format
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
