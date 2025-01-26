const { before, after } = require('node:test');

process.env.NODE_ENV = 'test';

const config = {
  ...require('../test_data/config.json'),
  port: 8888
};

before(function (_, done) {
  process.chdir('test_data');
  const { app, server } = require('../lib/server')(config, done);
  global.app = app;
  global.server = server;
});

after(function (done) {
  global.server.close(done);
});
