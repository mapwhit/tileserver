process.env.UV_THREADPOOL_SIZE = Math.ceil(
  Math.max(4, require('node:os').cpus().length * 1.5)
);

const fs = require('node:fs');
const path = require('node:path');
const connect = require('@pirxpilot/connect');
const Router = require('@pirxpilot/router');

const tiles = require('./tiles');

module.exports = makeServer;

function makeServer(config, callback = () => {}) {
  const { options = {}, data = {}, cacheControl } = config;

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

  const serving = Object.entries(data)
    .map(([id, item]) => {
      if (!item.mbtiles || item.mbtiles.length === 0) {
        console.error(`Missing "mbtiles" property for ${id}`);
        return;
      }
      const mountPath = `/data/${id}`;
      const { router, createTileJSON } = tiles(mountPath, options, item);
      app.use(mountPath, router);
      return createTileJSON;
    })
    .filter(Boolean);

  const router = new Router();
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

  function sendTileJSONs(req, res) {
    res.setHeader('Content-Type', 'application/json');
    const result = serving.map(fn => fn(req));
    res.end(JSON.stringify(result));
  }
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
