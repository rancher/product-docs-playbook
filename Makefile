local:
	mkdir -p tmp
	npx antora --version
	npx antora $(PDF_ANTORA_ARGS) --stacktrace --log-format=pretty --log-level=info \
		product-docs-playbook-local.yml \
		2>&1 | tee tmp/local-build.log 2>&1
	cp build/site/search-index.js tmp/.
	node product-docs-common/jscript/split-search-index.js build/site/search-index.js build/site/lang-indexes
	mkdir -p build/site/sitemaps.not-used
	find build/site -type f -name "sitemap*.xml" -exec sh -c 'mv "$$0" "$${0%.xml}.xml-not-used"' {} \;
	mv build/site/*.xml-not-used build/site/sitemaps.not-used/. > /dev/null 2>&1 || true
	gzip build/site/sitemaps.not-used/*.xml-not-used > /dev/null 2>&1 || true

remote:
	mkdir -p tmp
	npm ci
	npx antora --version
	npx antora $(PDF_ANTORA_ARGS) --stacktrace --log-format=pretty --log-level=info \
		product-docs-playbook-remote.yml \
		2>&1 | tee tmp/remote-build.log 2>&1
	cp build/site/search-index.js tmp/.
	node product-docs-common/jscript/split-search-index.js build/site/search-index.js build/site/lang-indexes
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

# Optional PDF build: pdf-options.yml activates it. Refer to
# dsc-style-bundle/pdf/README.md. Run make pdf before make local or make
# remote. Include pdf.mk last, so that local stays the default target.
PDF_PLAYBOOK ?= product-docs-playbook-local.yml
PDF_LOCAL_PLAYBOOK ?= product-docs-playbook-local.yml
DSC ?= dsc-style-bundle
-include $(DSC)/pdf/pdf.mk
