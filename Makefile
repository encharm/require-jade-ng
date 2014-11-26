all: jade.js jade-compiler.js dist

jade.js: jade-base.js jade/runtime.js
	node creator jade-base.js > jade.js

jade-compiler.js: jade-compiler-base.js jade/jade.js
	node creator jade-compiler-base.js > jade-compiler.js

dist/jade-compiler.js:
	uglifyjs jade-compiler.js -o dist/jade-compiler.js
	
dist/jade.js: 
	uglifyjs jade.js -o dist/jade.js

dist: dist/jade.js dist/jade-compiler.js

test: all test/main.js jade.js jade-compiler.js
	cd test && node r.js -o buildConfig.js
	@echo "Go to test directory, start a web server and open index.html / index-built.html"
