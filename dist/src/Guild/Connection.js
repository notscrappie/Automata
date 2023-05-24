"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
class Connection {
    player;
    sessionId;
    region;
    voice;
    self_mute;
    self_deaf;
    constructor(player) {
        this.player = player;
        this.sessionId = null;
        this.region = null;
        this.voice = {
            sessionId: null,
            token: null,
            endpoint: null,
        };
        this.self_mute = false;
        this.self_deaf = false;
    }
    /** Updates server information for the player's voice connection. */
    setServersUpdate({ endpoint, token }) {
        if (!endpoint)
            throw new Error('NO Session id found');
        this.voice.endpoint = endpoint;
        this.voice.token = token;
        this.region = endpoint.split('.').shift()?.replace(/[0-9]/g, '') ?? null;
        this.player.node.rest.updatePlayer({
            guildId: this.player.guildId,
            data: { voice: this.voice },
        });
    }
    /** Updates the state of the player. */
    setStateUpdate(data) {
        if (this.player.voiceChannel && data.channel_id && this.player.voiceChannel !== data.channel_id)
            this.player.voiceChannel = data.channel_id;
        this.self_deaf = data.self_deaf ?? true;
        this.self_mute = data.self_mute ?? false;
        this.voice.sessionId = data.session_id ?? null;
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map