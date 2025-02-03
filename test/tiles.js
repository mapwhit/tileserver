const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');

require('./setup');

const prefix = 'openmaptiles';

describe('Vector tiles', function () {
  describe('existing tiles', function () {
    testTile(prefix, 0, 0, 0, 200);
    testTile(prefix, 14, 8581, 5738, 200);

    it('should retrieve a specific tile', async function () {
      const res = await fetch(url(prefix, 5, 0, 0));
      const { status, headers } = res;
      assert.equal(status, 200);
      assert.equal(headers.get('Content-Encoding'), 'gzip');
      assert.match(headers.get('Content-Type'), /application\/x-protobuf/);
      assert.equal(headers.get('Content-Length'), '78');
      assert.match(
        headers.get('Last-Modified'),
        /\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT/
      );

      // curl --compress https://localhost:5080/data/openmaptiles/5/0/0.pbf > test/fixtures/5-0-0.pbf
      const pbf = await readFile(`${__dirname}/fixtures/5-0-0.pbf`);

      const body = await res.arrayBuffer();

      assert.deepEqual(Buffer.from(body), pbf);
    });
  });

  it('should return 304 for a fresh tile', async function () {
    const res = await fetch(url(prefix, 5, 0, 0), {
      headers: {
        'If-Modified-Since': 'Thu, 01 Dec 2017 00:00:00 GMT',
        'Cache-Control': ''
      }
    });
    assert.equal(res.status, 304);
  });

  describe('non-existent requests return 4xx', function () {
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
  it(`${path} returns ${status}`, async function () {
    const res = await fetch(path);
    if (status) {
      assert.equal(res.status, status);
    }
    if (status === 200) {
      assert.match(res.headers.get('Content-Type'), /application\/x-protobuf/);
    }
  });
}
