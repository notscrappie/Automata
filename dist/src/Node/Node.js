"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const ws_1 = require("ws");
const Rest_1 = require("./Rest");
class Node {
    automata;
    options;
    restURL;
    socketURL;
    isConnected;
    password;
    secure;
    regions;
    sessionId;
    rest;
    ws;
    resumeKey;
    resumeTimeout;
    autoResume;
    reconnectTimeout;
    reconnectTries;
    reconnectAttempt;
    attempt;
    stats;
    constructor(automata, node, options) {
        this.automata = automata;
        this.options = node;
        this.restURL = `http${node.secure ? 's' : ''}://${node.host}:${node.port}`;
        this.socketURL = `${this.secure ? 'wss' : 'ws'}://${node.host}:${node.port}/`;
        this.password = node.password || 'youshallnotpass';
        this.secure = node.secure || false;
        this.regions = node.region || null;
        this.rest = new Rest_1.Rest(this);
        this.resumeKey = options.resumeKey || null;
        this.resumeTimeout = options.resumeTimeout || 60;
        this.reconnectTimeout = options.reconnectTimeout || 5000;
        this.reconnectTries = options.reconnectTries || 5;
    }
    /** Connects to the Lavalink server using the WebSocket. */
    connect() {
        const headers = Object.assign({
            Authorization: this.password,
            'User-Id': this.automata.userId,
            'Client-Name': 'Shadowrunners - Automata Client',
        }, this.resumeKey && { 'Resume-Key': this.resumeKey });
        this.ws = new ws_1.WebSocket(this.socketURL, { headers });
        this.ws.on('open', this.open.bind(this));
        this.ws.on('error', this.error.bind(this));
        this.ws.on('message', this.message.bind(this));
        this.ws.on('close', this.close.bind(this));
    }
    /** Sends the payload to the Lavalink server. */
    send(payload) {
        const data = JSON.stringify(payload);
        try {
            console.log(`Send function data: ${data}`);
            this.ws.send(data);
            return null;
        }
        catch (error) {
            return error;
        }
    }
    /** Reconnects the client to the Lavalink server. */
    reconnect() {
        this.reconnectAttempt = setTimeout(() => {
            if (this.attempt > this.reconnectTries)
                this.automata.emit('nodeError', this);
            this.isConnected = false;
            this.ws?.removeAllListeners();
            this.ws = null;
            this.automata.emit('nodeReconnect', this);
            this.connect();
            this.attempt++;
        }, this.reconnectTimeout);
    }
    /** Disconnects the client from the Lavalink server. */
    disconnect() {
        if (!this.isConnected)
            return;
        this.automata.players.forEach((player) => {
            if (player.node === this)
                player.AutoMoveNode();
        });
        this.ws.close(1000, 'destroy');
        this.ws = null;
        this.automata.nodes.delete(this.options.name);
        this.automata.emit('nodeDisconnect', this);
    }
    /** Returns the penalty of the current node based on its statistics. */
    get penalties() {
        if (!this.isConnected)
            return 0;
        return this.stats.players +
            Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10) +
            (this.stats.frameStats?.deficit ?? 0) +
            (this.stats.frameStats?.nulled ?? 0) * 2;
    }
    /** Handles the 'open' event of the WebSocket connection. */
    open() {
        if (this.reconnectAttempt) {
            clearTimeout(this.reconnectAttempt);
            delete this.reconnectAttempt;
        }
        this.automata.emit('nodeConnect', this);
        this.isConnected = true;
        if (this.autoResume) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, player] of this.automata.players) {
                if (player.node === this)
                    player.restart();
            }
        }
    }
    /** Sets the stats. */
    setStats(packet) {
        this.stats = packet;
    }
    /** Handles the message received from the Lavalink node. */
    message(payload) {
        const packet = JSON.parse(payload);
        const player = this.automata.players.get(packet.guildId);
        this.automata.emit('raw', 'Node', packet);
        switch (packet.op) {
            case 'stats':
                delete packet.op;
                this.setStats(packet);
                break;
            case 'ready':
                this.rest.setSessionId(packet.sessionId);
                this.sessionId = packet.sessionId;
                if (this.resumeKey)
                    this.rest.patch(`/v3/sessions/${this.sessionId}`, {
                        resumingKey: this.resumeKey,
                        timeout: this.resumeTimeout,
                    });
                break;
            default:
                if (player)
                    player.emit(packet.op, packet);
                break;
        }
    }
    /** Handles the 'close' event of the WebSocket connection. */
    close(event) {
        this.automata.emit('nodeDisconnect', this, event);
    }
    /** Handles the 'error' event of the WebSocket connection. */
    error(event) {
        if (!event)
            return;
        this.automata.emit('nodeError', this, event);
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map