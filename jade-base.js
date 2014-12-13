(function() {

var buildMap = {};

var fsXhr = {
  readFileSync : function(fileName, mode) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",fileName,false);
    xhr.send();
    return xhr.response;
  },
  readFile : function(fileName, mode, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",fileName,true);
    xhr.send();
    xhr.onreadystatechange = function (aEvt) {
      if (xhr.readyState == 4) {
        if(xhr.status == 200 || xhr.status == 0) {
          cb(null, xhr.response);
        } else {
          cb(new Error("Got status code " + xhr.status));
        }
      }
    };
    xhr.onerror = cb;
  }
};

define('fs.jade', function() {
  return fsXhr;
});

var jadeRuntime = (function(require, exports, module) {
  //< include jade/lib/runtime.js | replace require('fs') require('fs.jade')
});

define('jade-runtime', jadeRuntime);

function patchText(text) {
  return text.replace(/^function template\(locals\) {\n/, 'function template(locals, attrs) { locals = attrs || locals;\n');
}


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
        var path = require.nodeRequire('path');
        getCompiler = function(cb) {
          cb(require.nodeRequire(path.join(config.baseUrl, 'jade-compiler')));
        }
        fetchText = function(url, cb) {
          try {
            cb(null, fs.readFileSync(url, 'utf8'));
          } catch(err) {
            cb(err);
          }
        };
      } else{
        fs = require.nodeRequire ? require.nodeRequire('fs') : fsXhr;
        getCompiler = function(cb) {
          require(['jade-compiler'], function(jadeCompiler) {
            cb(jadeCompiler);
          });
        }
        fetchText = function(url, cb) {
          fs.readFile(url, 'utf8', cb);
        }
      }
      
      var jadeCompiler, text;
      function run() {
        var f = jadeCompiler.compile(text, {
          filename: url
        });
        if(!buildMap[name] && config.isBuild) {
          buildMap[name] = patchText(jadeCompiler.compileClient(text, {filename: url}));
        }
        onload(function(locals, attrs) {
          return f(attrs || locals);
        });
      }
      fetchText(url, function (err, _text) {
        if(err) throw err;
        text = _text;
        // allow precompiled templates
        if(text.match(/^define\(\['jade-runtime']/)) {
          onload(text);
          text = null;
        }
        if(jadeCompiler && text) run();
      });
      getCompiler(function(_jadeCompiler) {
        jadeCompiler = _jadeCompiler;
        if(jadeCompiler && text) run();
      });
    }
  });

})();