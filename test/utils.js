import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fixTileJSONCenter, getTileUrls } from '../lib/utils.js';

describe('Utils', () => {
  describe('getTileUrls', () => {
    it('should return URLs with single domain from string', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const result = getTileUrls(req, 'tiles.example.com', '/tiles', 'pbf');
      assert.deepEqual(result, [
        'https://tiles.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });

    it('should return URLs with multiple domains from comma-separated string', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const result = getTileUrls(
        req,
        'a.example.com, b.example.com',
        '/tiles',
        'pbf'
      );
      assert.deepEqual(result, [
        'https://a.example.com/tiles/{z}/{x}/{y}.pbf',
        'https://b.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });

    it('should return URLs with multiple domains from array', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const result = getTileUrls(
        req,
        ['a.example.com', 'b.example.com'],
        '/tiles',
        'pbf'
      );
      assert.deepEqual(result, [
        'https://a.example.com/tiles/{z}/{x}/{y}.pbf',
        'https://b.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });

    it('should use request host when no domains provided', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'http'
        }
      };

      const result = getTileUrls(req, null, '/tiles', 'pbf');
      assert.deepEqual(result, ['http://example.com/tiles/{z}/{x}/{y}.pbf']);
    });

    it('should use https protocol when x-forwarded-proto starts with https', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https, http'
        }
      };

      const result = getTileUrls(req, 'tiles.example.com', '/tiles', 'pbf');
      assert.deepEqual(result, [
        'https://tiles.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });

    it('should use http protocol when x-forwarded-proto is not https', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'http'
        }
      };

      const result = getTileUrls(req, 'tiles.example.com', '/tiles', 'pbf');
      assert.deepEqual(result, [
        'http://tiles.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });

    it('should handle empty domains array', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const result = getTileUrls(req, [], '/tiles', 'pbf');
      assert.deepEqual(result, ['https://example.com/tiles/{z}/{x}/{y}.pbf']);
    });

    it('should handle empty string domains', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const result = getTileUrls(req, '', '/tiles', 'pbf');
      assert.deepEqual(result, ['https://example.com/tiles/{z}/{x}/{y}.pbf']);
    });

    it('should handle domains with whitespace around commas', () => {
      const req = {
        headers: {
          host: 'example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const result = getTileUrls(
        req,
        'a.example.com , b.example.com , c.example.com',
        '/tiles',
        'pbf'
      );
      assert.deepEqual(result, [
        'https://a.example.com/tiles/{z}/{x}/{y}.pbf',
        'https://b.example.com/tiles/{z}/{x}/{y}.pbf',
        'https://c.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });

    it('should handle request without x-forwarded-proto header', () => {
      const req = {
        headers: {
          host: 'example.com'
        }
      };

      const result = getTileUrls(req, 'tiles.example.com', '/tiles', 'pbf');
      assert.deepEqual(result, [
        'http://tiles.example.com/tiles/{z}/{x}/{y}.pbf'
      ]);
    });
  });

  describe('fixTileJSONCenter', () => {
    it('should calculate center when bounds are provided but center is missing', () => {
      const tileJSON = {
        bounds: [-180, -90, 180, 90]
      };

      fixTileJSONCenter(tileJSON);

      assert.ok(Array.isArray(tileJSON.center));
      assert.equal(tileJSON.center.length, 3);
      assert.equal(tileJSON.center[0], 0); // longitude center
      assert.equal(tileJSON.center[1], 0); // latitude center
      assert.equal(tileJSON.center[2], 2); // zoom level (calculated based on algorithm)
    });

    it('should not modify center when it already exists', () => {
      const tileJSON = {
        bounds: [-180, -90, 180, 90],
        center: [10, 20, 5]
      };

      const originalCenter = [...tileJSON.center];
      fixTileJSONCenter(tileJSON);

      assert.deepEqual(tileJSON.center, originalCenter);
    });

    it('should not add center when bounds are missing', () => {
      const tileJSON = {
        // No bounds property
      };

      fixTileJSONCenter(tileJSON);

      assert.equal(tileJSON.center, undefined);
    });

    it('should calculate correct zoom level for specific bounds', () => {
      const tileJSON = {
        bounds: [-180, -90, 180, 90]
      };

      fixTileJSONCenter(tileJSON);

      // For full world bounds, zoom should be 2 (based on the algorithm)
      assert.equal(tileJSON.center[2], 2);
    });

    it('should calculate correct center for partial bounds', () => {
      const tileJSON = {
        bounds: [-10, -5, 10, 5]
      };

      fixTileJSONCenter(tileJSON);

      assert.equal(tileJSON.center[0], 0); // longitude center
      assert.equal(tileJSON.center[1], 0); // latitude center
      // Zoom level should be calculated based on the bounds
      assert.ok(typeof tileJSON.center[2] === 'number');
    });

    it('should calculate correct zoom level for various bound sizes', () => {
      const testCases = [
        { bounds: [-180, -90, 180, 90], expectedZoom: 2 }, // Full world
        { bounds: [-90, -45, 90, 45], expectedZoom: 3 }, // Half world
        { bounds: [-45, -22.5, 45, 22.5], expectedZoom: 4 } // Quarter world
      ];

      testCases.forEach(({ bounds, expectedZoom }) => {
        const tileJSON = { bounds };
        fixTileJSONCenter(tileJSON);
        assert.equal(
          tileJSON.center[2],
          expectedZoom,
          `Expected zoom ${expectedZoom} for bounds ${JSON.stringify(bounds)}`
        );
      });
    });

    it('should handle bounds with different aspect ratios', () => {
      const tileJSON = {
        bounds: [-20, -10, 20, 10] // Wider than tall
      };

      fixTileJSONCenter(tileJSON);

      assert.equal(tileJSON.center[0], 0); // longitude center
      assert.equal(tileJSON.center[1], 0); // latitude center
      assert.ok(typeof tileJSON.center[2] === 'number');
    });

    it('should handle negative bounds correctly', () => {
      const tileJSON = {
        bounds: [-100, -50, -50, -25]
      };

      fixTileJSONCenter(tileJSON);

      assert.equal(tileJSON.center[0], -75); // longitude center
      assert.equal(tileJSON.center[1], -37.5); // latitude center
      assert.ok(typeof tileJSON.center[2] === 'number');
    });
  });
});
