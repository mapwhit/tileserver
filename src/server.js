#!/usr/bin/env node
'use strict';

process.env.UV_THREADPOOL_SIZE =
    Math.ceil(Math.max(4, require('os').cpus().length * 1.5));

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');

var clone = require('clone'),
    connect = require('connect'),
    parseurl = require('parseurl'),
    Router = require('router');

var serve_data = require('./serve_data'),
    utils = require('./utils');

module.exports = function(opts, callback) {
  console.log('Starting server');

  var app = connect(),
      serving = {
        data: {}
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
  paths.mbtiles = path.resolve(paths.root, paths.mbtiles || '');

  var checkPath = function(type) {
    if (!fs.existsSync(paths[type])) {
      console.error('The specified path for "' + type + '" does not exist (' + paths[type] + ').');
      process.exit(1);
    }
  };
  checkPath('mbtiles');

  var data = clone(config.data || {});

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

  Object.keys(data).forEach(function(id) {
    var item = data[id];
    if (!item.mbtiles || item.mbtiles.length === 0) {
      console.log('Missing "mbtiles" property for ' + id);
      return;
    }

    app.use('/data/', serve_data(options, serving.data, item, id));
  });

  var router = new Router();

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
