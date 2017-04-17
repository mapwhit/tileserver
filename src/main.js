#!/usr/bin/env node

'use strict';

var path = require('path');

var ms = require('ms');

var packageJson = require('../package');

var opts = require('nomnom')
  .option('mbtiles', {
    help: 'MBTiles file - ignored if the configuration file is also specified',
    position: 0
  })
  .option('config', {
    abbr: 'c',
    default: 'config.json',
    help: 'Configuration file'
  })
  .option('bind', {
    abbr: 'b',
    help: 'Bind address'
  })
  .option('port', {
    abbr: 'p',
    default: 8080,
    help: 'Port'
  })
  .option('cors', {
    default: true,
    help: 'Enable Cross-origin resource sharing headers'
  })
  .option('max-age', {
    help: 'Configue max-age for Cache-Control header: "5d", "3h", "1y" etc.'
  })
  .option('verbose', {
    abbr: 'V',
    flag: true,
    help: 'More verbose output'
  })
  .option('version', {
    abbr: 'v',
    flag: true,
    help: 'Version info',
    callback: function() {
      return packageJson.name + ' v' + packageJson.version;
    }
  }).parse();


console.log('Starting ' + packageJson.name + ' v' + packageJson.version);

function startServer(configPath) {
  var maxAge = opts['max-age'];
  var cacheControl;

  if (maxAge) {
    cacheControl = 'public, max-age=' + Math.floor(ms(maxAge) / 1000);
  }
  return require('./server')({
    configPath: configPath,
    bind: opts.bind,
    port: opts.port,
    cors: opts.cors,
    maxAge: maxAge,
    cacheControl: cacheControl
  });
}

startServer(path.resolve(opts.config));
