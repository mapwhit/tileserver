const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');

require('./setup');

const prefix = 'openmaptiles';

describe('Vector tiles', () => {
  describe('existing tiles', () => {
    testTile(prefix, 0, 0, 0, 200);
    testTile(prefix, 6, 0, 0, 200);

    it('should retrieve a specific tile', async () => {
      const res = await fetch(url(prefix, 5, 16, 11));
      const { status, headers } = res;
      assert.equal(status, 200);
      assert.equal(headers.get('Content-Encoding'), 'gzip');
      assert.match(headers.get('Content-Type'), /application\/x-protobuf/);
      assert.equal(headers.get('Content-Length'), '15306');
      assert.match(
        headers.get('Last-Modified'),
        /\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT/
      );
      assert.equal(headers.get('ETag'), '"3bca-Iq1waT78kNVJwPtrQZerCU7/GH0"');
      const body = await res.arrayBuffer();
      // await writeFile(`${__dirname}/fixtures/5-0-0.pbf`, Buffer.from(body));

      const pbf = await readFile(`${__dirname}/fixtures/5-0-0.pbf`);
      assert.deepEqual(Buffer.from(body), pbf);
    });
  });

  it('should return 304 for a fresh tile', async () => {
    const res = await fetch(url(prefix, 5, 16, 11), {
      headers: {
        'If-Modified-Since': 'Wed, 15 Dec 2021 00:00:00 GMT',
        'Cache-Control': ''
      }
    });
    assert.equal(res.status, 304);
  });

  it('should return 304 for a fresh tile with matching ETag', async () => {
    const res = await fetch(url(prefix, 5, 16, 11), {
      headers: {
        'If-None-Match': '"3bca-Iq1waT78kNVJwPtrQZerCU7/GH0"',
        'Cache-Control': ''
      }
    });
    assert.equal(res.status, 304);
  });

  describe('non-existent requests return 4xx', () => {
    testTile('non_existent', 0, 0, 0, 404);
    testTile(prefix, -1, 0, 0, 404); // err zoom
    testTile(prefix, 20, 0, 0, 404); // zoom out of bounds
    testTile(prefix, 0, 1, 0, 404);
    testTile(prefix, 0, 0, 1, 404);

    testTile(prefix, 14, 0, 0, 404); // non existent tile
  });
});

function url(prefix, z, x, y) {
  return `${global.prefix}/data/${prefix}/${z}/${x}/${y}.pbf`;
}

function testTile(prefix, z, x, y, status) {
  const path = url(prefix, z, x, y);
  it(`${path} returns ${status}`, async () => {
    const res = await fetch(path);
    if (status) {
      assert.equal(res.status, status);
    }
    if (status === 200) {
      assert.match(res.headers.get('Content-Type'), /application\/x-protobuf/);
    }
  });
}
