const { before, after } = require('node:test');
const path = require('node:path');

process.env.NODE_ENV = 'test';

const config = {
  options: {
    paths: {
      root: path.resolve(__dirname, './fixtures/test_data')
    }
  },
  data: {
    openmaptiles: {
      mbtiles: 'countries.mbtiles'
    }
  },
  port: 8888
};

before((_, done) => {
  // process.chdir(path.resolve(__dirname, './fixtures/test_data'));
  const { app, server } = require('../lib/server')(config, done);
  global.app = app;
  global.server = server;
  const { port } = server.address();
  global.prefix = `http://localhost:${port}`;
});

after(done => {
  global.server.close(done);
});
