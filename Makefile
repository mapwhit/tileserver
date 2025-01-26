check: lint test

lint:
	./node_modules/.bin/biome ci

format:
	./node_modules/.bin/biome format --write

TEST_OPTS := --test-concurrency=1
test: test_data
	node --test $(TEST_OPTS) test/tiles.js test/metadata.js

test-cov: TEST_OPTS += --experimental-test-coverage
test-cov: test

%: /tmp/%.zip
	unzip -q $< -d $@

/tmp/%.zip:
	wget -O $@ https://github.com/klokantech/tileserver-gl/releases/download/v1.3.0/$(@F)

.PHONY: check lint format test test-cov
