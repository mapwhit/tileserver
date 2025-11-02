import ms from 'ms';
import rc from 'rc';
import makeServer from './lib/server.js';
import packageJSON from './package.json' with { type: 'json' };

const { name, version } = packageJSON;

const config = rc('tiles', {
  port: process.env.PORT || 5080,
  bind: process.env.BIND
  // max-age: // 'max-age for Cache-Control header: "5d", "3h", "1y" etc.'
});

function startServer() {
  config.cacheControl = cacheControl(config['max-age']);

  console.log(`Starting ${name} v${version}`);
  console.log(`Port ${config.port} on ${config.bind}`);

  return makeServer(config);
}

function cacheControl(maxAgeMillis) {
  if (!maxAgeMillis) {
    return false;
  }
  const maxAge = Math.floor(ms(maxAgeMillis) / 1000);
  return `public, max-age=${maxAge}`;
}

startServer();
