/* jshint maxcomplexity: 8 */

var moment = require('moment');

var bot = module.parent.exports.bot;
var data = module.parent.exports.data;

var CHANNEL = require(__dirname + '/../config.json').channel;
var NICKBOT = require(__dirname + '/../config.json').nick;

/*
 * Alimenta um contador de mensagens para cada usuário
 */

bot.addListener('message' + CHANNEL, function(from) {
  var userMessagesPath = 'core.user_messages';
  var userMessages = data.getPath(userMessagesPath);

  if (typeof userMessages === 'undefined') {
    userMessages = {};
  }

  if (typeof userMessages[from] === 'undefined') {
    userMessages[from] = 1;
  } else {
    userMessages[from]++;
  }

  data.setPath(userMessagesPath, userMessages);
});

/*
 * Registra/atualiza o pico de usuários do canal
 */

bot.addListener('names' + CHANNEL, function(nicks) {
  var usersPath = 'core.users';
  var users = data.getPath(usersPath);

  if (typeof users === 'undefined' || users.length === 1) {
    users = Object.keys(nicks);
    data.setPath(usersPath, users);
  }

  var recordPath = 'core.record';
  var record = data.getPath(recordPath);

  if (typeof record === 'undefined' || Object.keys(nicks).length > record.value) {
    record = {
      value: Object.keys(nicks).length,
      when: moment().format()
    };
    data.setPath(recordPath, record);
    bot.message('Batemos um novo recorde: ' + record.value + ' usuários simultâneos!');
  }
});

/*
 * Boas vindas a novos usuários
 */

bot.addListener('join' + CHANNEL, function(nick) {
  var usersPath = 'core.users';
  var users = data.getPath(usersPath);

  if (typeof users === 'undefined') {
    users = [nick];
    data.setPath(usersPath, users);
  }

  if (users.indexOf(nick) === -1) {
    users.push(nick);
    data.setPath(usersPath, users);
    bot.message(nick + ', notei que é novo no canal, seja bem vindo :)');
  }

  // dispara o evento acima ('names' + CHANNEL)
  // para atualizar o recorde se necessário

  bot.send('NAMES', CHANNEL);
});

/*
 * Listener necessário para o comando !socorro (src/commands/socorro.js)
 */

bot.addListener('names' + CHANNEL, function(nicks) {
  var pedindoSocorroPath = 'pedindo_socorro';
  var pedindoSocorro = data.getPath(pedindoSocorroPath);

  if (typeof pedindoSocorro === 'undefined' || pedindoSocorro === false) {
    return false;
  }

  var socorroUsersPath = 'socorro';
  var socorroUsers = data.getPath(socorroUsersPath);

  if (typeof socorroUsers === 'undefined') {
    socorroUsers = {};
  }

  if (typeof socorroUsers[pedindoSocorro] !== 'undefined') {
    var now = new Date().getTime();
    var then = socorroUsers[pedindoSocorro];
    if ((now - then) < 1000 * 60 * 60 * 24) {
      bot.message(pedindoSocorro + ', você só pode pedir "socorro" uma vez a cada 24 horas!');
      data.setPath(pedindoSocorroPath, false);
      return false;
    }
  }

  var onlineUsers = Object.keys(nicks);

  onlineUsers.splice(onlineUsers.indexOf(pedindoSocorro), 1);
  onlineUsers.splice(onlineUsers.indexOf(NICKBOT), 1);

  if (onlineUsers.length === 0) {
    bot.message(pedindoSocorro + ', este canal não possui usuários para te ajudar. Boa sorte!');
  } else {
    bot.message(onlineUsers.join(' ') + ', ' + pedindoSocorro + ' precisa de ajuda!');
    socorroUsers[pedindoSocorro] = new Date().getTime();
    data.setPath(socorroUsersPath, socorroUsers);
  }

  data.setPath(pedindoSocorroPath, false);
});

/*
 * Handler de exceções não capturadas
 */

bot.addListener('error', function(err) {
  throw err;
});

/*
 * Método para simplificar o envio de mensagens
 */

bot.message = function(message) {
  bot.say(CHANNEL, message);
};
