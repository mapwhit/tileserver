const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

require('./setup');

const { prefix } = global;

function testTileJSONArray(url) {
  describe(`${url} is array of TileJSONs`, () => {
    it('is json', async () => {
      const res = await fetch(prefix + url);

      assert.equal(res.status, 200);
      assert.match(res.headers.get('Content-Type'), /application\/json/);
    });

    it('is non-empty array', async () => {
      const res = await fetch(prefix + url);

      const body = await res.json();
      assert.ok(Array.isArray(body));
      assert.ok(body.length > 0);
    });
  });
}

function testTileJSON(url) {
  describe(`${url} is TileJSON`, () => {
    it('is json', async () => {
      const res = await fetch(prefix + url);

      assert.equal(res.status, 200);
      assert.match(res.headers.get('Content-Type'), /application\/json/);
    });

    it('has valid tiles', async () => {
      const res = await fetch(prefix + url);

      const body = await res.json();
      assert.ok(Array.isArray(body.tiles));
      assert.ok(body.tiles.length > 0);
    });
  });
}

describe('Metadata', () => {
  testTileJSONArray('/index.json');
  testTileJSONArray('/data.json');

  testTileJSON('/data/openmaptiles.json');
});
