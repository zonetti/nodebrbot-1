var CHANNEL = require(__dirname + '/../../config.json').channel;

// este comando dispara um evento cujo listener está implementado em src/default_listeners.js

var socorro = function(bot, data, nick, args, end) {
  data.setPath('pedindo_socorro', nick);
  bot.send('NAMES', CHANNEL);
  end();
};

exports.run = socorro;