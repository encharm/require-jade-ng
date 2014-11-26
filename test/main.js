define(function(require) {
  var body = require('jade!body');
  document.body.innerHTML = body();
});