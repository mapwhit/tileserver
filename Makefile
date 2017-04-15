check: lint test

lint:
	./node_modules/.bin/jshint src test

test: test_data
	./node_modules/.bin/mocha --recursive

%: /tmp/%.zip
	unzip -q $< -d $@

/tmp/%.zip:
	wget -O $@ https://github.com/klokantech/tileserver-gl/releases/download/v1.3.0/$(@F)


.PHONY: check lint test
