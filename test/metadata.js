const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const supertest = require('supertest');

require('./setup');

const { app } = global;

function testTileJSONArray(url) {
  describe(`${url} is array of TileJSONs`, function () {
    it('is json', async function () {
      await supertest(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('is non-empty array', async function () {
      await supertest(app)
        .get(url)
        .expect(function (res) {
          assert.ok(Array.isArray(res.body));
          assert.ok(res.body.length > 0);
        });
    });
  });
}

function testTileJSON(url) {
  describe(`${url} is TileJSON`, function () {
    it('is json', async function () {
      await supertest(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('has valid tiles', async function () {
      await supertest(app)
        .get(url)
        .expect(function (res) {
          assert.ok(Array.isArray(res.body.tiles));
          assert.ok(res.body.tiles.length > 0);
        });
    });
  });
}

describe('Metadata', function () {
  testTileJSONArray('/index.json');
  testTileJSONArray('/data.json');

  testTileJSON('/data/openmaptiles.json');
});
