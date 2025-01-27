process.env.UV_THREADPOOL_SIZE = Math.ceil(
  Math.max(4, require('node:os').cpus().length * 1.5)
);

const fs = require('node:fs');
const path = require('node:path');
const querystring = require('node:querystring');
const connect = require('@pirxpilot/connect');
const parseurl = require('parseurl');
const Router = require('@pirxpilot/router');

const tiles = require('./tiles');
const utils = require('./utils');

module.exports = makeServer;

function makeServer(config, callback = () => {}) {
  const { options = {}, data = {}, cacheControl } = config;

  const serving = {
    data: {}
  };

  const paths = (options.paths ??= {});
  paths.mbtiles = path.resolve(paths.root || '', paths.mbtiles || '');
  checkPath(paths, 'mbtiles');

  const app = connect();
  if (cacheControl) {
    app.use(function (req, res, next) {
      req.cacheControl = cacheControl;
      next();
    });
  }

  app.use(function (req, res, next) {
    const url = parseurl(req);
    req.query = querystring.parse(url.query);

    const header = req.headers['x-forwarded-proto'];
    if (header) {
      req.protocol = header.startsWith('https') ? 'https' : 'http';
    } else {
      req.protocol = 'http';
    }

    next();
  });

  Object.entries(data).forEach(([id, item]) => {
    if (!item.mbtiles || item.mbtiles.length === 0) {
      console.log(`Missing "mbtiles" property for ${id}`);
      return;
    }
    const { router, data } = tiles(options, item, id);
    serving.data[id] = data;
    app.use('/data/', router);
  });

  const router = new Router();

  function sendTileJSONs(req, res) {
    const result = Object.keys(serving.data).map(function (id) {
      const info = Object.assign({}, serving.data[id]);
      const path = `data/${id}`;
      info.tiles = utils.getTileUrls(req, info.tiles, path, info.format, {
        pbf: options.pbfAlias
      });
      return info;
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  }

  router.get(['/index.json', '/data.json'], sendTileJSONs);

  app.use(router);

  const server = app.listen(config.port, config.bind, function () {
    const { address, port } = this.address();
    console.log('Listening on http://[%s]:%d/', address, port);
    return callback();
  });

  process.on('SIGINT', function () {
    process.exit();
  });

  return {
    app,
    server
  };
}

function checkPath(paths, type = 'mbtiles') {
  if (!fs.existsSync(paths[type])) {
    console.error(
      `The specified path for "${type}" does not exist (${paths[type]}).`
    );
    process.exit(1);
  }
  console.log('%s located in %s', type, paths[type]);
}
