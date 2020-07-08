process.env.UV_THREADPOOL_SIZE =
    Math.ceil(Math.max(4, require('os').cpus().length * 1.5));

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const connect = require('@pirxpilot/connect');
const parseurl = require('parseurl');
const Router = require('router');

const serve_data = require('./serve_data');
const utils = require('./utils');

module.exports = makeServer;

function makeServer(config, callback = () => {}) {

  const {
    options = {},
    data = {},
    cacheControl,
  } = config;

  const serving = {
    data: {}
  };

  const { paths = {} } = options;
  options.paths = paths;

  paths.mbtiles = path.resolve(paths.root || '', paths.mbtiles || '');
  checkPath(paths, 'mbtiles');

  const app = connect();
  if (cacheControl) {
    app.use(function(req, res, next) {
      req.cacheControl = cacheControl;
      next();
    });
  }

  app.use(function(req, res, next) {
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

  Object.keys(data).forEach(function(id) {
    const item = data[id];
    if (!item.mbtiles || item.mbtiles.length === 0) {
      console.log(`Missing "mbtiles" property for ${id}`);
      return;
    }

    app.use('/data/', serve_data(options, serving.data, item, id));
  });

  const router = new Router();

  function sendTileJSONs(req, res) {
    const result = Object.keys(serving.data).map(function(id) {
      const info = Object.assign({}, serving.data[id]);
      const path = `data/${id}`;
      info.tiles = utils.getTileUrls(req, info.tiles, path, info.format, {
        'pbf': options.pbfAlias
      });
      return info;
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  }

  router.get('/index.json', sendTileJSONs);
  router.get('/data.json', sendTileJSONs);

  app.use(router);

  const server = app.listen(config.port, config.bind, function() {
    const { address, port } = this.address();
    console.log('Listening on http://[%s]:%d/', address, port);
    return callback();
  });

  process.on('SIGINT', function() {
    process.exit();
  });

  setTimeout(callback, 1000);
  return {
    app,
    server
  };
}

function checkPath(paths, type = 'mbtiles') {
  if (!fs.existsSync(paths[type])) {
    console.error(`The specified path for "${type}" does not exist (${paths[type]}).`);
    process.exit(1);
  }
  console.log('%s located in %s', type, paths[type]);
}
