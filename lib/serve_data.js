const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const Router = require('@pirxpilot/router');
const mbtiles = require('@mapwhit/mbtiles');

const { fixTileJSONCenter, getTileUrls } = require('./utils');

function isGzipped(data) {
  return data[0] === 0x1f && data[1] === 0x8b;
}

function zip(tile, fn) {
  if (tile.isGzipped) {
    return fn();
  }
  zlib.gzip(tile.data, function (err, buffer) {
    if (!err) {
      tile.data = buffer;
      tile.isGzipped = true;
    }
    fn(err);
  });
}

function initZoomRanges(min, max) {
  const ranges = [];
  let value = 2 ** min;
  let i;

  for (i = min; i <= max; i++) {
    ranges[i] = value;
    value *= 2;
  }

  return ranges;
}

module.exports = serveData;

function serveData(options, repo, params, id) {
  const router = new Router();

  const mbtilesFile = path.resolve(options.paths.mbtiles, params.mbtiles);
  const tileJSON = {
    tiles: params.domains || options.domains
  };

  repo[id] = tileJSON;

  const mbtilesFileStats = fs.statSync(mbtilesFile);
  if (!mbtilesFileStats.isFile() || mbtilesFileStats.size === 0) {
    throw Error(`Not valid MBTiles file: ${mbtilesFile}`);
  }
  const source = new mbtiles(mbtilesFile);
  const info = source.getInfo();
  tileJSON['name'] = id;
  tileJSON['format'] = 'pbf';

  Object.assign(tileJSON, info);

  tileJSON['tilejson'] = '2.0.0';
  delete tileJSON['filesize'];
  delete tileJSON['mtime'];
  delete tileJSON['scheme'];

  Object.assign(tileJSON, params.tilejson || {});
  fixTileJSONCenter(tileJSON);

  const zoomRanges = initZoomRanges(tileJSON.minzoom, tileJSON.maxzoom);

  const tilePattern = `/${id}/:z/:x/:y.pbf`;

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
      res.statusCode = 404;
      return res.end('Out of bounds');
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
      res.statusCode = status;
      return res.end(err.message);
    }
    if (data == null) {
      return res.status(404).send('Not found');
    }
    req.tile = {
      data,
      headers,
      contentType: 'application/x-protobuf',
      isGzipped: isGzipped(data)
    };
    next();
  }

  function zipTile(req, res, next) {
    zip(req.tile, next);
  }

  function sendTile(req, res) {
    const headers = req.tile.headers;

    delete headers['ETag']; // do not trust the tile ETag -- regenerate
    headers['Content-Type'] = req.tile.contentType;
    headers['Content-Encoding'] = 'gzip';
    if (req.cacheControl) {
      headers['Cache-Control'] = req.cacheControl;
    }

    Object.keys(headers).forEach(function (name) {
      res.setHeader(name, headers[name]);
    });

    res.end(req.tile.data);
  }

  router.get(tilePattern, checkParams, getTile, zipTile, sendTile);

  router.get(`/${id}.json`, function (req, res) {
    const info = Object.assign({}, tileJSON);
    info.tiles = getTileUrls(req, info.tiles, `data/${id}`, info.format, {
      pbf: options.pbfAlias
    });
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(info));
  });

  return router;
}
