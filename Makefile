local:
	mkdir -p tmp
	npx antora --version
	npx antora --stacktrace --log-format=pretty --log-level=info product-docs-playbook-local.yml 2>&1 | tee tmp/local-build.log 2>&1
	cp build/site/search-index.js tmp/.
	node ./product-docs-common/jscript/split-search-index.js build/site/search-index.js build/site/lang-indexes
	rm -f build/site/lang-indexes/search-index-source.js
	mkdir -p build/site/sitemaps.not-used
	find build/site -type f -name "sitemap*.xml" -exec sh -c 'mv "$$0" "$${0%.xml}.xml-not-used"' {} \;
	mv build/site/*.xml-not-used build/site/sitemaps.not-used/. > /dev/null 2>&1 || true
	gzip build/site/sitemaps.not-used/*.xml-not-used > /dev/null 2>&1 || true

remote:
	mkdir -p tmp
	npm ci
	npx antora --version
	npx antora --stacktrace --log-format=pretty --log-level=info product-docs-playbook-remote.yml 2>&1 | tee tmp/remote-build.log 2>&1
	cp build/site/search-index.js tmp/.
	node ./product-docs-common/jscript/split-search-index.js build/site/search-index.js build/site/lang-indexes
	rm -f build/site/lang-indexes/search-index-source.js
	mkdir -p build/site/sitemaps.not-used
	find build/site -type f -name "sitemap*.xml" -exec sh -c 'mv "$$0" "$${0%.xml}.xml-not-used"' {} \;
	mv build/site/*.xml-not-used build/site/sitemaps.not-used/. > /dev/null 2>&1 || true
	gzip build/site/sitemaps.not-used/*.xml-not-used > /dev/null 2>&1 || true

clean:
	rm -rf build

environment:
	npm ci

preview:
	npx http-server build/site -c-1
