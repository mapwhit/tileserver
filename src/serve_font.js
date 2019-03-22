'use strict';

var Router = require('router'),
    fs = require('fs'),
    path = require('path');

var utils = require('./utils');

module.exports = function(options, allowedFonts) {
  var router = new Router();

  var lastModified = new Date().toUTCString();

  var fontPath = options.paths.fonts;

  var existingFonts = {};
  fs.readdir(options.paths.fonts, function(err, files) {
    files.forEach(function(file) {
      fs.stat(path.join(fontPath, file), function(err, stats) {
        if (!err) {
          if (stats.isDirectory() &&
              fs.existsSync(path.join(fontPath, file, '0-255.pbf'))) {
            existingFonts[path.basename(file)] = true;
          }
        }
      });
    });
  });

  router.get('/fonts/:fontstack/:range([\\d]+-[\\d]+).pbf',
      function(req, res) {
    var fontstack = decodeURI(req.params.fontstack);
    var range = req.params.range;

    return utils.getFontsPbf(options.serveAllFonts ? null : allowedFonts,
      fontPath, fontstack, range, existingFonts,
        function(err, concated) {
      if (err || concated.length === 0) {
        // console.log(err);
        // console.log(concated.length);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('');
      } else {
        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Last-Modified', lastModified);
        return res.end(concated);
      }
    });
  });

  router.get('/fonts.json', function(req, res) {
    res.header('Content-type', 'application/json');
    return res.send(
      Object.keys(options.serveAllFonts ? existingFonts : allowedFonts).sort()
    );
  });

  return router;
};
