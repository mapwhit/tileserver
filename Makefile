check: lint test

lint:
	./node_modules/.bin/jshint lib test

test: test_data
	node --test  --test-concurrency=1  test/tiles_data.js test/metadata.js

%: /tmp/%.zip
	unzip -q $< -d $@

/tmp/%.zip:
	wget -O $@ https://github.com/klokantech/tileserver-gl/releases/download/v1.3.0/$(@F)


.PHONY: check lint test
