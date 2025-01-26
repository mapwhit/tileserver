const { before, after } = require('node:test');

process.env.NODE_ENV = 'test';

global.should = require('should');
global.supertest = require('supertest');

const config = Object.assign({
  port: 8888
}, require('../test_data/config.json'));

before(function() {
  process.chdir('test_data');
  const {
    app,
    server
  } = require('../lib/server')(config);
  global.app = app;
  global.server = server;
});

after(function() {
  global.server.close(function() {});
});
