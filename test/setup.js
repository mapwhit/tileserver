import path from 'node:path';
import { after, before } from 'node:test';
import makeServer from '../lib/server.js';

process.env.NODE_ENV = 'test';

const config = {
  options: {
    paths: {
      root: path.resolve(import.meta.dirname, './fixtures/test_data')
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
  // process.chdir(path.resolve(import.meta.dirname, './fixtures/test_data'));
  const { app, server } = makeServer(config, done);
  global.app = app;
  global.server = server;
  const { port } = server.address();
  global.prefix = `http://localhost:${port}`;
});

after(done => {
  global.server.close(done);
});
