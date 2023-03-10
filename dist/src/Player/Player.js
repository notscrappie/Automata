"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const Connection_1 = require("./Connection");
const Queue_1 = __importDefault(require("../guild/Queue"));
const events_1 = require("events");
const Filters_1 = require("./Filters");
const Response_1 = require("../guild/Response");
class Player extends events_1.EventEmitter {
    data;
    automata;
    node;
    connection;
    queue;
    filters;
    guildId;
    voiceChannel;
    textChannel;
    currentTrack;
    previousTrack;
    isPlaying;
    isPaused;
    isConnected;
    loop;
    position;
    ping;
    timestamp;
    mute;
    deaf;
    volume;
    constructor(automata, node, options) {
        super();
        this.automata = automata;
        this.node = node;
        this.queue = new Queue_1.default();
        this.connection = new Connection_1.Connection(this);
        this.guildId = options.guildId;
        this.filters = new Filters_1.Filters(this);
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.currentTrack = null;
        this.previousTrack = null;
        this.deaf = options.deaf ?? false;
        this.mute = options.mute ?? false;
        this.volume = 100;
        this.isPlaying = false;
        this.isPaused = false;
        this.position = 0;
        this.ping = 0;
        this.timestamp = null;
        this.isConnected = false;
        this.loop = "NONE";
        this.data = {};
        this.on("playerUpdate", ({ state: { connected, position, ping, time } }) => {
            this.isConnected = connected;
            this.position = position;
            this.ping = ping;
            this.timestamp = time;
        });
        this.on("event", (data) => this.eventHandler(data));
    }
    /** Sends a request to the server and plays the requested song. */
    async play() {
        if (this.queue.length === 0)
            return;
        const { track } = this.currentTrack = this.queue.shift();
        if (!track)
            await this.currentTrack.resolve(this.automata);
        this.isPlaying = true;
        this.position = 0;
        this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                encodedTrack: this.currentTrack.track,
            },
        });
    }
    /** Connects to the user's voice channel. */
    connect(options = this) {
        const { guildId, voiceChannel, deaf, mute } = options;
        this.send({
            guild_id: guildId,
            channel_id: voiceChannel,
            self_deaf: deaf ?? true,
            self_mute: mute ?? false,
        });
        this.isConnected = true;
    }
    /** Stops the player from playing. */
    stop() {
        this.position = 0;
        this.isPlaying = false;
        this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: { encodedTrack: null },
        });
        return this;
    }
    /** Pauses the player. */
    pause(toggle) {
        this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: { paused: toggle },
        });
        this.isPlaying = !toggle;
        this.isPaused = toggle;
        return this;
    }
    /** Seeks the track. */
    seekTo(position) {
        const newPosition = Math.min(position + this.position, this.currentTrack.info.length);
        this.node.rest.updatePlayer({ guildId: this.guildId, data: { position: newPosition } });
    }
    /** Sets the volume of the player. */
    setVolume(volume) {
        if (volume < 0 || volume > 100)
            throw new RangeError('Volume must be between 1-100.');
        this.node.rest.updatePlayer({ guildId: this.guildId, data: { volume } });
        this.volume = volume;
        return this;
    }
    /** Sets the current loop. */
    setLoop(mode) {
        const validModes = new Set(['NONE', 'TRACK', 'QUEUE']);
        if (!validModes.has(mode))
            throw new TypeError('setLoop only accepts NONE, TRACK and QUEUE as arguments.');
        this.loop = mode;
        return this;
    }
    /** Sets the text channel where event messages (trackStart, trackEnd etc.) will be sent. */
    setTextChannel(channel) {
        this.textChannel = channel;
        return this;
    }
    /** Sets the voice channel. */
    setVoiceChannel(channel, options) {
        if (this.isConnected && channel == this.voiceChannel)
            throw new ReferenceError(`Player is already connected to ${channel}`);
        this.voiceChannel = channel;
        this.connect({
            deaf: options.deaf ?? this.deaf,
            guildId: this.guildId,
            voiceChannel: this.voiceChannel,
            textChannel: this.textChannel,
            mute: options.mute ?? this.mute,
        });
        return this;
    }
    set(key, value) {
        return (this.data[key] = value);
    }
    get(key) {
        return this.data[key];
    }
    /** Disconnects the player. */
    disconnect() {
        if (!this.voiceChannel)
            return;
        this.pause(true);
        this.isConnected = false;
        this.send({
            guild_id: this.guildId,
            channel_id: null,
        });
        delete this.voiceChannel;
        return this;
    }
    /** Destroys the player. */
    destroy() {
        this.disconnect();
        this.node.rest.destroyPlayer(this.guildId);
        this.automata.players.delete(this.guildId);
    }
    /** Restarts the player. */
    restart() {
        if (!this.currentTrack?.track) {
            if (this.queue.length)
                this.play();
            return;
        }
        this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                position: this.position,
                encodedTrack: this.currentTrack.track,
            },
        });
    }
    /** Moves the player to another node. */
    moveNode(name) {
        const node = this.automata.nodes.get(name);
        if (!node || node.name === this.node.name)
            return;
        if (!node.isConnected)
            throw new Error("The node provided is not available.");
        this.node.rest.destroyPlayer(this.guildId);
        this.automata.players.delete(this.guildId);
        this.node = node;
        this.automata.players.set(this.guildId, this);
        this.restart();
    }
    /** Automatically moves the node. */
    AutoMoveNode() {
        const [node] = this.automata.leastUsedNodes;
        if (!node)
            throw new Error("There aren't any available nodes.");
        if (!this.automata.nodes.has(node.name))
            return this.destroy();
        this.moveNode(node.name);
    }
    /** Handles lavalink related events. */
    eventHandler(data) {
        switch (data.type) {
            case "TrackStartEvent": {
                this.isPlaying = true;
                this.automata.emit("playerStart", this, this.currentTrack);
                break;
            }
            case "TrackEndEvent": {
                this.previousTrack = this.currentTrack;
                if (this.loop === "TRACK") {
                    this.queue.unshift(this.previousTrack);
                    this.automata.emit("playerEnd", this, this.currentTrack);
                    return this.play();
                }
                else if (this.currentTrack && this.loop === "QUEUE") {
                    this.queue.push(this.previousTrack);
                    this.automata.emit("playerEnd", this, this.currentTrack, data);
                    return this.play();
                }
                if (this.queue.length === 0) {
                    this.isPlaying = false;
                    return this.automata.emit("playerDisconnect", this);
                }
                else if (this.queue.length > 0) {
                    this.automata.emit("playerEnd", this, this.currentTrack);
                    return this.play();
                }
                this.isPlaying = false;
                this.automata.emit("playerDisconnect", this);
                break;
            }
            case "TrackStuckEvent": {
                this.automata.emit("playerError", this, this.currentTrack, data);
                this.stop();
                break;
            }
            case "TrackExceptionEvent": {
                this.automata.emit("playerError", this, this.currentTrack, data);
                this.stop();
                break;
            }
            case "WebSocketClosedEvent": {
                if ([4015, 4009].includes(data.code)) {
                    this.send({
                        guild_id: data.guildId,
                        channel_id: this.voiceChannel,
                        self_mute: this.mute,
                        self_deaf: this.deaf,
                    });
                }
                this.automata.emit("playerClose", this, this.currentTrack, data);
                this.pause(true);
                break;
            }
            default: {
                throw new Error(`An unknown event: ${data}`);
            }
        }
    }
    /** Resolves the provided query. */
    async resolve({ query, source, requester }) {
        const regex = /^https?:\/\//;
        let url;
        if (regex.test(query))
            url = `/v3/loadtracks?identifier=${encodeURIComponent(query)}`;
        else
            url = `/v3/loadtracks?identifier=${encodeURIComponent(`${source || "dzsearch"}:${query}`)}`;
        const response = await this.node.rest.get(url);
        return new Response_1.Response(response, requester);
    }
    /** Sends the data to the Lavalink node the old fashioned way. */
    send(data) {
        this.automata.send({ op: 4, d: data });
    }
}
exports.Player = Player;
//# sourceMappingURL=Player.js.map