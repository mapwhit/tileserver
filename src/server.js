#!/usr/bin/env node
'use strict';

process.env.UV_THREADPOOL_SIZE =
    Math.ceil(Math.max(4, require('os').cpus().length * 1.5));

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');

var clone = require('clone'),
    cors = require('cors'),
    connect = require('connect'),
    parseurl = require('parseurl'),
    Router = require('router');

var serve_font = require('./serve_font'),
    serve_style = require('./serve_style'),
    serve_data = require('./serve_data'),
    utils = require('./utils');

module.exports = function(opts, callback) {
  console.log('Starting server');

  var app = connect(),
      serving = {
        styles: {},
        data: {},
        fonts: {}
      };

  callback = callback || function() {};

  var config = opts.config || null;
  var configPath = null;
  if (opts.configPath) {
    configPath = path.resolve(opts.configPath);
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

  var options = config.options || {};
  var paths = options.paths || {};
  options.paths = paths;
  paths.root = path.resolve(
    configPath ? path.dirname(configPath) : process.cwd(),
    paths.root || '');
  paths.styles = path.resolve(paths.root, paths.styles || '');
  paths.fonts = path.resolve(paths.root, paths.fonts || '');
  paths.sprites = path.resolve(paths.root, paths.sprites || '');
  paths.mbtiles = path.resolve(paths.root, paths.mbtiles || '');

  var checkPath = function(type) {
    if (!fs.existsSync(paths[type])) {
      console.error('The specified path for "' + type + '" does not exist (' + paths[type] + ').');
      process.exit(1);
    }
  };
  checkPath('styles');
  checkPath('fonts');
  checkPath('sprites');
  checkPath('mbtiles');

  var data = clone(config.data || {});

  if (opts.cors) {
    app.use(cors());
  }
  if (opts.cacheControl) {
    app.use(function(req, res, next) {
      req.cacheControl = opts.cacheControl;
      next();
    });
  }

  app.use(function(req, res, next) {
    var url = parseurl(req);
    req.query = querystring.parse(url.query);
    next();
  });

  Object.keys(config.styles || {}).forEach(function(id) {
    var item = config.styles[id];
    if (!item.style || item.style.length === 0) {
      console.log('Missing "style" property for ' + id);
      return;
    }

    if (item.serve_data !== false) {
      app.use('/styles/', serve_style(options, serving.styles, item, id,
        function(mbtiles, fromData) {
          var dataItemId;
          Object.keys(data).forEach(function(id) {
            if (fromData) {
              if (id == mbtiles) {
                dataItemId = id;
              }
            } else {
              if (data[id].mbtiles == mbtiles) {
                dataItemId = id;
              }
            }
          });
          if (dataItemId) { // mbtiles exist in the data config
            return dataItemId;
          } else if (fromData) {
            console.log('ERROR: data "' + mbtiles + '" not found!');
            process.exit(1);
          } else {
            var id = mbtiles.substr(0, mbtiles.lastIndexOf('.')) || mbtiles;
            while (data[id]) id += '_';
            data[id] = {
              'mbtiles': mbtiles
            };
            return id;
          }
        }, function(font) {
          serving.fonts[font] = true;
        }));
    }
  });

  app.use('/', serve_font(options, serving.fonts));

  Object.keys(data).forEach(function(id) {
    var item = data[id];
    if (!item.mbtiles || item.mbtiles.length === 0) {
      console.log('Missing "mbtiles" property for ' + id);
      return;
    }

    app.use('/data/', serve_data(options, serving.data, item, id, serving.styles));
  });

  var router = new Router();

  router.get('/styles.json', function(req, res) {
    var result = [];
    var query = req.query.key ? ('?key=' + req.query.key) : '';
    Object.keys(serving.styles).forEach(function(id) {
      var styleJSON = serving.styles[id];
      result.push({
        version: styleJSON.version,
        name: styleJSON.name,
        id: id,
        url: req.protocol + '://' + req.headers.host +
             '/styles/' + id + '.json' + query
      });
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  });

  function sendTileJSONs(req, res) {
    var result = [];
    Object.keys(serving.data).forEach(function(id) {
      var info = clone(serving.data[id]);
      var path = 'data/' + id;
      info.tiles = utils.getTileUrls(req, info.tiles, path, info.format, {
        'pbf': options.pbfAlias
      });
      result.push(info);
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  }

  router.get('/index.json', sendTileJSONs);
  router.get('/data.json', sendTileJSONs);

  app.use(router);

  var server = app.listen(process.env.PORT || opts.port, process.env.BIND || opts.bind, function() {
    console.log('Listening at http://%s:%d/',
                this.address().address, this.address().port);

    return callback();
  });

  process.on('SIGINT', function() {
      process.exit();
  });

  setTimeout(callback, 1000);
  return {
    app: app,
    server: server
  };
};
