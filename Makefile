check: lint test

lint:
	./node_modules/.bin/biome ci

format:
	./node_modules/.bin/biome format --write

TEST_OPTS := --test-concurrency=1
test: test/fixtures/test_data/countries.mbtiles
	node --test $(TEST_OPTS) test/tiles.js test/metadata.js

test-cov: TEST_OPTS += --experimental-test-coverage
test-cov: test

test/fixtures/test_data/countries.mbtiles:
	wget -S -O $@ https://github.com/klokantech/vector-tiles-sample/releases/download/v1.0/countries.mbtiles

.PHONY: check lint format test test-cov
