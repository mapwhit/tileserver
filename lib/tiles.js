const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const fresh = require('fresh');
const Router = require('@pirxpilot/router');
const mbtiles = require('@mapwhit/mbtiles');

const { fixTileJSONCenter, getTileUrls } = require('./utils');

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
  router.get(`/:z/:x/:y.${suffix}`, checkParams, sendTile);
  router.get('/{.json}', sendData);
  return { router, createTileJSON };

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

  function sendTile(req, res, next) {
    const { z, x, y } = req.params;
    const { tile, headers, error } = source.getTile(z, x, y);
    if (error) {
      const { message } = error;
      const status = /does not exist/.test(message) ? 404 : 500;
      return res.writeHead(status, message).end();
    }
    if (tile == null) {
      return next(404);
    }
    if (options.removeETag) {
      delete headers['ETag']; // do not trust the tile ETag -- regenerate
    }
    if (!options.noETag && !headers['ETag']) {
      headers['ETag'] = etag(tile);
    }
    headers['Content-Type'] ??= 'application/x-protobuf';
    res.setHeaders(new Headers(headers));
    if (
      fresh(req.headers, {
        etag: headers['ETag'],
        'last-modified': headers['Last-Modified']
      })
    ) {
      res.writeHead(304).end();
    } else {
      res.setHeader('Content-Length', tile.byteLength);
      res.end(tile);
    }
  }

  function sendData(req, res) {
    const info = createTileJSON(req);
    const payload = JSON.stringify(info);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(payload));
    return res.end(payload);
  }

  function createTileJSON(req) {
    return {
      ...tileJSON,
      tiles: getTileUrls(req, domains, mountPath, suffix)
    };
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

function etag(buffer) {
  const hash = createHash('sha1').update(buffer).digest('base64').slice(0, -1);
  const len = buffer.byteLength.toString(16);
  return `"${len}-${hash}"`;
}
