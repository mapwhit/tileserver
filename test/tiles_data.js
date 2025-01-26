const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const supertest = require('supertest');

require('./setup');

function url(prefix, z, x, y) {
  return `/data/${prefix}/${z}/${x}/${y}.pbf`;
}

function testTile(prefix, z, x, y, status) {
  const path = url(prefix, z, x, y);
  it(`${path} returns ${status}`, async function () {
    const test = supertest(global.app).get(path);
    if (status) await test.expect(status);
    if (status === 200)
      await test.expect('Content-Type', /application\/x-protobuf/);
  });
}

function binaryParser(res, callback) {
  res.setEncoding('binary');
  res.data = '';
  res.on('data', function (chunk) {
    res.data += chunk;
  });
  res.on('end', function () {
    callback(null, Buffer.from(res.data, 'binary'));
  });
}

const prefix = 'openmaptiles';

describe('Vector tiles', function () {
  describe('existing tiles', function () {
    testTile(prefix, 0, 0, 0, 200);
    testTile(prefix, 14, 8581, 5738, 200);

    it('should retrieve a specific tile', async function () {
      // curl --compress https://localhost:8080/data/openmaptiles/5/0/0.pbf > test/fixtures/5-0-0.pbf
      const body = require('node:fs').readFileSync(
        `${__dirname}/fixtures/5-0-0.pbf`
      );

      const res = await supertest(global.app)
        .get(url(prefix, 5, 0, 0))
        .expect(200)
        .expect('Content-Type', /application\/x-protobuf/)
        // please note - supertest will gunzip the response for us
        .expect('Content-Encoding', 'gzip')
        .buffer()
        .parse(binaryParser);

      assert.deepEqual(res.body, body);
    });
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
