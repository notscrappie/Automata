<p align="center">
  <img src="https://i.imgur.com/GTPBh5x.png" />
</p>

<div align="center"> 
  <img src="https://deepsource.io/gh/shadowrunners/Automata.svg/?label=active+issues&show_trend=true&token=lWLKFmoDqIp0GpfoY2sCAJS2"/>
</div>

# What's this and how is it different from Poru?

Automata is a fork of the Poru lavalink client developed and maintained by [parasop](https://github.com/parasop). This fork contains tweaks to certain functions and modified functionality such as the de-coupling from YouTube entirely with this fork only being able to play audio from platforms such as Deezer, SoundCloud, Spotify etc and some performance related optimizations.

The old v1 branch is based on Poru 3.7.2. This branch is based on Poru v4 with full support for Lavalink's new REST API.

# Installation (if you're crazy enough)

```
npm install @shadowrunners/automata
```

## Example

```javascript
const { Client, GatewayIntentBits } = require("discord.js");
const { Manager } = require("@shadowrunners/automata");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.manager = new Manager(
  client,
  {
    name: "main_node",
    host: "localhost",
    port: 8080,
    password: "iloveyou3000",
  },
  {
    reconnectTime: 0,
    resumeKey: "MyPlayers",
    resumeTimeout: 60,
    defaultPlatform: "dzsearch",
  }
);

client.manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  return channel.send(`Now playing \`${track.title}\``);
});

client.on("ready", () => {
  console.log("Ready!");
  client.manager.init(client);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { options, member, guild, channelId } = interaction;

  interaction.deferReply();

  if (!member.voice.channel) return interaction.editReply({ embeds: [embed.setDescription('🔹 | You need to be in a voice channel to use this command.')] });

  const query = options.getString("query");
  const res = await client.manager.resolve({ query, requester: member });

  const player = client.manager.create({
    guildId: guild.id,
    voiceChannel: member.voice.channelId,
    textChannel: channelId,
    deaf: true,
  });

  switch (res.loadType) {
    case 'LOAD_FAILED': return interaction.editReply({ content: "Failed to load track." });
    case 'NO_MATCHES': return interaction.editReply({ content: "No results found." });
    case 'PLAYLIST_LOADED': {
      for (const track of res.tracks) player.queue.add(track);

      interaction.editReply({ content: `${res.playlistInfo.name} has been loaded with ${res.tracks.length}` });
    case 'SEARCH_RESULT':
    case 'TRACK_LOADED':
      player.queue.add(res.tracks[0]);
      if (!player.isPlaying && player.isConnected) player.play();
      interacton.editReply(`Enqueued track: \n \`${track.title}\``);
  }
});

client.login('wee woo discord token goes here');
```

## Credits

Full credit goes to [parasop](https://github.com/parasop) for creating Poru.
