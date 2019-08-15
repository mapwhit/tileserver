process.env.UV_THREADPOOL_SIZE =
    Math.ceil(Math.max(4, require('os').cpus().length * 1.5));

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const clone = require('clone');
const connect = require('connect');
const parseurl = require('parseurl');
const Router = require('router');

const serve_data = require('./serve_data');
const utils = require('./utils');

module.exports = makeServer;

function makeServer(opts, callback = () => {}) {
  console.log('Starting server');

  const app = connect();

  const serving = {
    data: {}
  };

  let { config, configPath } = opts;
  if (configPath) {
    configPath = path.resolve(configPath);
    try {
      config = clone(require(configPath));
    } catch (e) {
      console.log('ERROR: Config file not found or invalid!');
      console.log('       See README.md for instructions and sample data.');
      process.exit(1);
    }
  }
  if (!config) {
    console.log('ERROR: No config file not specified!');
    process.exit(1);
  }

  const { options = {} } = config;
  const { paths = {} } = options;
  options.paths = paths;
  paths.root = path.resolve(
    configPath ? path.dirname(configPath) : process.cwd(),
    paths.root || '');
  paths.mbtiles = path.resolve(paths.root, paths.mbtiles || '');

  const checkPath = function(type) {
    if (!fs.existsSync(paths[type])) {
      console.error(`The specified path for "${type}" does not exist (${paths[type]}).`);
      process.exit(1);
    }
  };
  checkPath('mbtiles');

  const data = clone(config.data || {});

  if (opts.cacheControl) {
    app.use(function(req, res, next) {
      req.cacheControl = opts.cacheControl;
      next();
    });
  }

  app.use(function(req, res, next) {
    const url = parseurl(req);
    req.query = querystring.parse(url.query);
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
      const info = clone(serving.data[id]);
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

  const server = app.listen(process.env.PORT || opts.port, process.env.BIND || opts.bind, function() {
    console.log('Listening at http://%s:%d/', this.address().address, this.address().port);
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
