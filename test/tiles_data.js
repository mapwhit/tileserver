const { describe, it } = require('node:test');

require('./setup');

function url(prefix, z, x, y) {
  return `/data/${prefix}/${z}/${x}/${y}.pbf`;
}

function testTile(prefix, z, x, y, status) {
  const path = url(prefix, z, x, y);
  it(`${path} returns ${status}`, function (t, done) {
    const test = supertest(app).get(path);
    if (status) test.expect(status);
    if (status === 200) test.expect('Content-Type', /application\/x-protobuf/);
    test.end(done);
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

    it('should retrieve a specific tile', function (t, done) {
      // curl --compress https://localhost:8080/data/openmaptiles/5/0/0.pbf > test/fixtures/5-0-0.pbf
      const body = require('node:fs').readFileSync(`${__dirname}/fixtures/5-0-0.pbf`);

      supertest(app)
        .get(url(prefix, 5, 0, 0))
        .expect(200)
        .expect('Content-Type', /application\/x-protobuf/)
        // please note - supertest will gunzip the response for us
        .expect('Content-Encoding', 'gzip')
        .buffer()
        .parse(binaryParser)
        .end(function (err, res) {
          res.body.should.eql(body);
          done(err);
        });
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
