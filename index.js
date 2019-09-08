const ms = require('ms');
const commander = require('commander');

const { name, version } = require('./package.json');
const makeServer = require('./lib/server');

const opts = commander
  .version(version)
  .option('-c, --config <path>', 'config file path', 'config.json')
  .option('-b, --bind <address>', 'bind IP address', process.env.BIND)
  .option('-p, --port <port>', 'port', process.env.PORT || 5080)
  .option('--max-age <millis>', 'max-age for Cache-Control header: "5d", "3h", "1y" etc.', parseMillis)
  .action(startServer);

opts.parse(process.argv);

function startServer() {

  console.log(`Starting ${name} v${version}`);
  console.log(opts.bind, opts.port, opts.maxAge, opts.config);

  return makeServer({
    configPath: opts.config,
    bind: opts.bind,
    port: opts.port,
    cacheControl: opts.maxAge ? `public, max-age=${opts.maxAge}` : false
  });
}

function parseMillis(str) {
  return Math.floor(ms(str) / 1000);
}
