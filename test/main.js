define(function(require) {
  var body = require('jade!body');
  var jade = require('jade');

  document.body.innerHTML = body();
});