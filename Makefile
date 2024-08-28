local:
	mkdir -p tmp
	npx antora --version
	npx antora --stacktrace --log-format=pretty \
		product-docs-playbook.yml \
		2>&1 | tee tmp/local-build.log 2>&1

netlify:
	mkdir -p tmp
	npm install && npm update
	npx antora --version
	npx antora --stacktrace --log-format=pretty \
		lh-netlify-playbook.yml \
		2>&1 | tee tmp/netlify-build.log 2>&1

clean:
	rm -rf build

environment:
	npm install && npm update

after_clone: environment
	git branch --remotes
	@git branch --remotes \
		| sed 's/remotes\///' \
		| grep -Ev 'HEAD|main' \
		| while read b; do \
				v=$$(echo $$b | sed 's/origin\///'); \
				git checkout $$b; \
				git switch -c $$v; \
				git switch main; \
			done > /dev/null 2>&1
	@echo Local branches created
	git branch


