## require-jade-ng

jade plugin for require.js that will follow upstream easily

### Usage

Copy `dist/jade.js` and `dist/jade-compiler.js` into your Require.JS root.

Now you can do `require('jade!file');` where `file` will download `file.jade` from your web server.
In development it will just work and in production the jade file will get compiled into your optimized built and no requests will be made.

### Development of this plugin
```
git clone https://github.com/encharm/require-jade-ng.git
cd require-jade-ng
git submodule update --init --recursive
npm install -g uglify-js
make
```
### License

MIT
