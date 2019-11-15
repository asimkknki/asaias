const keep_alive = require("./keep_alive.js"); //index.js Const Kısımlarına

var http = require("http");

http
  .createServer(function(req, res) {
    res.write("Ehü Ehü");
    res.end();
  })
  .listen(8080);

///////////////////////////////////////////////////////////////////////////////

const Discord = require("discord.js");
const { Client, Util } = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const ayarlar = require("./ayarlar.json");
const { promisify } = require("util");
const chalk = require("chalk");
require("./util/eventLoader")(client);
const moment = require("moment");
const db = require("quick.db");
const ms = require("parse-ms");

const log = message => {
  console.log(`${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Komut - ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

//////////////////////////////////////////////////////////////////////////////

client.on("message", async message => {
  const a = message.content.toLowerCase();
  if (
    a === "slam" ||
    a === "sa" ||
    a === "selamun aleyküm" ||
    a === "selamın aleyküm" ||
    a === "selam" ||
    a === "slm"
  ) {
    let i = await db.fetch(`saas_${message.guild.id}`);
    if (i === "acik") {
      const embed = new Discord.RichEmbed()
        .setColor("BLACK")
        .setTitle("Sa-As sistemi!")
        .setDescription(
          "<a:Mor:640249897232236556> **Aleyküm Selam, Hoşgeldin!**"
        );

      message.channel.send(embed).then(msg => msg.delete(5000));
    }
  }
});

//////////////////////////////////////////////////////////////////////////////

const DiscordAntiSpam = require("discord-anti-spam");
client.on("message", async message => {
  const spengel = await db.fetch(`spam_${message.guild.id}`);
  if (spengel == "acik") {
    const AntiSpam = new DiscordAntiSpam({
      warnThreshold: 3,
      banThreshold: 7, // Amount of messages sent in a row that will cause a ban
      maxInterval: 2000, // Amount of time (in ms) in which messages are cosidered spam.
      warnMessage: "{@user}, Lütfen spam yapmayı durdur!", // Message will be sent in chat upon warning.
      banMessage:
        "**{user_tag}** Aşırı derecede spam yaptığı için sunucudan yasaklandı!", // Message will be sent in chat upon banning.
      maxDuplicatesWarning: 7, // Amount of same messages sent that will be considered as duplicates that will cause a warning.
      maxDuplicatesBan: 15, // Amount of same messages sent that will be considered as duplicates that will cause a ban.
      deleteMessagesAfterBanForPastDays: 1, // Amount of days in which old messages will be deleted. (1-7)
      exemptPermissions: ["MANAGE_MESSAGE", "BAN_MEMBERS"], // Bypass users with at least one of these permissions
      ignoreBots: true, // Ignore bot messages
      verbose: false, // Extended Logs from module
      ignoredUsers: [], // Array of string user IDs that are ignored
      ignoredGuilds: [], // Array of string Guild IDs that are ignored
      ignoredChannels: [] // Array of string channels IDs that are ignored
    });
  } else {
    return;
  }
});

//////////////////////////////////////////////////////////////////////////////
client.elevation = message => {
  if (!message.guild) {
    return;
  }

  let permlvl = 0;
  if (message.member.hasPermission("KICK_MEMBERS")) permlvl = 1;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.login(ayarlar.token);
