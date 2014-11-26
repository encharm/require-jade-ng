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
        if(xhr.status == 200) {
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
  if(typeof XMLHttpRequest !== 'undefined')
    return fsXhr;
  return require('fs');
});

var jadeRuntime = (function(exports) {
  'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return (Array.isArray(val) ? val.map(joinClasses) :
    (val && typeof val === 'object') ? Object.keys(val).filter(function (key) { return val[key]; }) :
    [val]).filter(nulls).join(' ');
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};


exports.style = function (val) {
  if (val && typeof val === 'object') {
    return Object.keys(val).map(function (style) {
      return style + ':' + val[style];
    }).join(';');
  } else {
    return val;
  }
};
/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if (key === 'style') {
    val = exports.style(val);
  }
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    if (JSON.stringify(val).indexOf('&') !== -1) {
      console.warn('Since Jade 2.0.0, ampersands (`&`) in data attributes ' +
                   'will be escaped to `&amp;`');
    };
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will eliminate the double quotes around dates in ' +
                   'ISO form after 2.0.0');
    }
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  var result = String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || require('fs.jade').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};
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
          buildMap[name] = jadeCompiler.compileClient(text, {filename: url});
        }
        onload(f);        
      }
      getCompiler(function(_jadeCompiler) {
        jadeCompiler = _jadeCompiler;
        if(jadeCompiler && text) run();
      });
      fetchText(url, function (err, _text) {
        if(err) throw err;
        text = _text;
        if(jadeCompiler && text) run();
      });
    }
  });

})();