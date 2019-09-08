process.env.NODE_ENV = 'test';

global.should = require('should');
global.supertest = require('supertest');

before(function() {
  console.log('global setup');
  process.chdir('test_data');
  const {
    app,
    server
  } = require('../lib/server')({
    configPath: 'config.json',
    port: 8888
  });
  global.app = app;
  global.server = server;
});

after(function() {
  console.log('global teardown');
  global.server.close(function() { console.log('Done'); });
});
