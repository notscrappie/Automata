class Voice {
	constructor(player) {
		this.player = player;
		this.sessionId = null;
		this.region = null;
		this.sessionId = null;
		this.muted = false;
		this.deafened = false;
		this.voiceServer = null;
	}

	setServersUpdate(data) {
		const { player, sessionId } = this;
		const { guildId, node, automata } = player;
		const { endpoint } = data;

		if (!endpoint) return automata.emit('error', 'Voice · The session endpoint is missing. Double check your client intents.');
		this.voiceServer = data;
		if (!sessionId) return automata.emit('error', 'Voice · The session ID is missing.');

		this.region = endpoint?.split('.')[0]?.replace(/\d/g, '') ?? null;
		node.send({ op: 'voiceUpdate', guildId, sessionId, event: data });
	}

	setStateUpdate(data) {
		const { channelId } = this.player;
		const { session_id, channel_id, self_deaf, self_mute } = data;

		if (channelId && (channel_id && channelId !== channel_id)) this.player.setVoiceChannel(channel_id);
		this.deafened = self_deaf;
		this.muted = self_mute;
		this.sessionId = session_id || null;
	}
}


module.exports = Voice;
