var requirejs = require('requirejs');


var jade = requirejs('./jade');

module.exports = {
  compile: function(file, cb) {
    requirejs('jade!'+file, function(func) {
      cb(func);
    });
  }
};
