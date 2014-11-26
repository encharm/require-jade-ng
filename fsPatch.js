if(!fs.readFileSync) {
  if(typeof XMLHttpRequest !== 'undefined') {
    fs.readFileSync = function(fileName, mode) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET",fileName,false);
      xhr.send();
      return xhr.response;
    };
  } else {
    fs.readFileSync = require('fs').readFileSync;
  }
}