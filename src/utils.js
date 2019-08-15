module.exports = {
  getTileUrls,
  fixTileJSONCenter
};

function getTileUrls(req, domains, path, format, aliases) {
  if (domains && typeof domains === 'string') {
    domains = domains.split(/\s*,\s*/);
  }

  if (!domains || domains.length === 0) {
    domains = [req.headers.host];
  }

  if (aliases && aliases[format]) {
    format = aliases[format];
  }

  return domains.map(
    domain =>`${req.protocol}://${domain}/${path}/{z}/{x}/{y}.${format}`
  );
}

function fixTileJSONCenter(tileJSON) {
  if (tileJSON.bounds && !tileJSON.center) {
    const fitWidth = 1024;
    const tiles = fitWidth / 256;
    tileJSON.center = [
      (tileJSON.bounds[0] + tileJSON.bounds[2]) / 2,
      (tileJSON.bounds[1] + tileJSON.bounds[3]) / 2,
      Math.round(
        -Math.log((tileJSON.bounds[2] - tileJSON.bounds[0]) / 360 / tiles) /
        Math.LN2
      )
    ];
  }
}
