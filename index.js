const ms = require('ms');
const config = require('rc')('tiles', {
  port: process.env.PORT || 5080,
  bind: process.env.BIND,
  // max-age: // 'max-age for Cache-Control header: "5d", "3h", "1y" etc.'
});

const { name, version } = require('./package.json');
const makeServer = require('./lib/server');

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
