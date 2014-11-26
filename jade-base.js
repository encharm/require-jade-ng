(function() {

var buildMap = {};

var fsXhrSync = {
  readFileSync : function(fileName, mode) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",fileName,false);
    xhr.send();
    return xhr.response;
  }
};

define('fs.jade', function() {
  return fsXhrSync;
});

var jadeRuntime = (function(exports) {
  //< include jade/lib/runtime.js | replace require('fs') require('fs.jade')
});

define('jade-runtime', jadeRuntime);


define({
    version: '1.0.0',
    compile: function(str, locals, cb) {
      require(['jade-compiler'], function(jadeCompiler) {
        try {
          cb(null, jadeCompiler.compile(str, locals));
        } catch(err) {
          cb(err);
        }
      });
    },
    write: function (pluginName, name, write) {
        if (name in buildMap) {
            var text = buildMap[name];
            write("define('"+pluginName+"!"+name+"', ['jade-runtime'], function(jade){ return " + text + "});\n");
        }
    },
    load: function (name, req, onload, config) {
      var url = req.toUrl(name + '.jade');

      var fetchText;
      var fs;
      var getCompiler;
      if(config.isBuild) {
        fs = require.nodeRequire('fs');
        getCompiler = function(cb) {
          cb(require.nodeRequire('./jade-compiler'));
        }
      } else{
        fs = fsXhrSync;
        getCompiler = function(cb) {
          require(['jade-compiler'], function(jadeCompiler) {
            cb(jadeCompiler);
          });
        }
      }
      var fetchText = function(url, cb) {
        cb(fs.readFileSync(url, 'utf8'));
      };
      
      getCompiler(function(jadeCompiler) {
        fetchText(url, function (text) {
          var f = jadeCompiler.compile(text, {
            filename: url
          });
          if(!buildMap[name] && config.isBuild) {
            buildMap[name] = jadeCompiler.compileClient(text, {filename: url});
          }
          onload(f);
        });
      });
    }
  });

})();