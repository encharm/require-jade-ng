var fs = require('fs');

var text = fs.readFileSync(process.argv[2], 'utf8');

var actions = {
  include: function(text, file) {
    return fs.readFileSync(file, 'utf8');
  },
  fixFs: function(text) {
    return text;
  },
  replace: function(text, a, b) {
    return text.replace(a, b);
  },
  nameDefine: function(text, name) {
    return text.replace(/define\(/, 'define("' + name + '",');
  },
  followupWithFile: function(text, a, file) {
    return text.replace(a, a + '\n' + fs.readFileSync(file, 'utf8'));
  }
};


text = text.replace(/\/\/<(.*)\n/g, function(match, contents, offset, s) {
  
  var commands = contents.split('|');
  //console.log(commands);

  commands = commands.map(function(command) {
    command = command.replace(/^\s*/, "").replace(/\s*$/, "");
    return command.split(' ');
  });

  var text = '';
  commands.forEach(function(args) {
    var name = args.shift();
    args.unshift(text);
    text = actions[name].apply(null, args);
  });
  return text;
});

process.stdout.write(text);