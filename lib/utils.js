export function getTileUrls(req, domains, path, format) {
  if (domains && typeof domains === 'string') {
    domains = domains.split(/\s*,\s*/);
  }

  if (!domains || domains.length === 0) {
    domains = [req.headers.host];
  }

  const protocol = req.headers['x-forwarded-proto']?.startsWith('https')
    ? 'https'
    : 'http';

  return domains.map(
    domain => `${protocol}://${domain}${path}/{z}/{x}/{y}.${format}`
  );
}

export function fixTileJSONCenter(tileJSON) {
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
