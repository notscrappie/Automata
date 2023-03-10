"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const ws_1 = __importDefault(require("ws"));
const Rest_1 = require("./Rest");
class Node {
    isConnected;
    automata;
    name;
    restURL;
    socketURL;
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
    options;
    constructor(automata, node, options) {
        this.automata = automata;
        this.name = node.name;
        this.options = node;
        this.restURL = `http${node.secure ? "s" : ""}://${node.host}:${node.port}`;
        this.socketURL = `${this.secure ? "wss" : "ws"}://${node.host}:${node.port}/`;
        this.password = node.password || "youshallnotpass";
        this.secure = node.secure || false;
        this.regions = node.region || null;
        this.sessionId = null;
        this.rest = new Rest_1.Rest(automata, this);
        this.ws = null;
        this.resumeKey = options.resumeKey || null;
        this.resumeTimeout = options.resumeTimeout || 60;
        this.reconnectTimeout = options.reconnectTimeout || 5000;
        this.reconnectTries = options.reconnectTries || 5;
        this.reconnectAttempt = null;
        this.attempt = 0;
        this.isConnected = false;
        this.stats = null;
    }
    /** Connects to the Lavalink server using the WebSocket. */
    connect() {
        if (this.ws)
            this.ws.close();
        const headers = {
            Authorization: this.password,
            "User-Id": this.automata.userId,
            "Client-Name": "Shadowrunners - Automata Client",
        };
        if (this.resumeKey)
            headers["Resume-Key"] = this.resumeKey;
        this.ws = new ws_1.default(this.socketURL, { headers });
        this.ws.on("open", () => this.open());
        this.ws.on("error", (error) => this.error(error));
        this.ws.on("message", (message) => this.message(message));
        this.ws.on("close", (code) => this.close(code));
    }
    /** Sends the payload to the Lavalink server. */
    async send(payload) {
        const data = JSON.stringify(payload);
        if (this.ws.readyState === ws_1.default.OPEN)
            this.ws.send(data);
        else
            await new Promise((resolve, reject) => {
                this.ws.once("open", () => {
                    this.ws.send(data);
                    resolve();
                });
                this.ws.once("error", (error) => {
                    reject(error);
                });
            });
    }
    /** Reconnects the client to the Lavalink server. */
    reconnect() {
        const { reconnectTries, name, attempt, } = this;
        this.reconnectAttempt = setTimeout(() => {
            if (attempt > reconnectTries)
                throw new Error(`Unable to connect to node ${name} after ${reconnectTries} tries.`);
            this.isConnected = false;
            this.ws?.removeAllListeners();
            this.ws = null;
            this.automata.emit("nodeReconnect", this);
            this.connect();
            this.attempt++;
        }, this.reconnectTimeout);
    }
    /** Disconnects the client from the Lavalink server. */
    async disconnect() {
        if (!this.isConnected)
            return;
        let player;
        const playersToMove = [];
        for (player of this.automata.players) {
            if (player.node === this)
                playersToMove.push(player);
        }
        await Promise.all(playersToMove.map((player) => player.AutoMoveNode()));
        this.ws.close(1000, "destroy");
        this.ws?.removeAllListeners();
        this.automata.nodes.delete(this.name);
        this.automata.emit("nodeDisconnect", this);
    }
    /** Returns the penalty of the current node based on its statistics. */
    get penalties() {
        let penalties = 0;
        const { players, cpu, frameStats } = this.stats;
        penalties += players;
        penalties += Math.round(Math.pow(1.05, 100 * cpu.systemLoad) * 10 - 10);
        if (this.stats.frameStats) {
            penalties += frameStats.deficit;
            penalties += frameStats.nulled * 2;
        }
        return penalties;
    }
    /** Handles the 'open' event of the WebSocket connection. */
    open() {
        if (this.reconnectAttempt) {
            clearTimeout(this.reconnectAttempt);
            delete this.reconnectAttempt;
        }
        this.automata.emit("nodeConnect", this);
        this.isConnected = true;
        if (this.autoResume) {
            for (const [_, player] of this.automata.players) {
                if (player.node === this)
                    player.restart?.();
            }
        }
    }
    /** Sets the stats. */
    setStats(packet) {
        this.stats = packet;
    }
    /** Handles the message received from the Lavalink node. */
    message(payload) {
        const { sessionId, resumeKey, resumeTimeout } = this;
        const packet = JSON.parse(payload);
        this.automata.emit("raw", "Node", packet);
        switch (packet.op) {
            case "stats":
                delete packet.op;
                this.setStats(packet);
                break;
            case "ready":
                this.rest.setSessionId(packet.sessionId);
                this.sessionId = packet.sessionId;
                if (this.resumeKey)
                    this.rest.patch(`/v3/sessions/${sessionId}`, { resumingKey: resumeKey, timeout: resumeTimeout });
                break;
            default:
                const player = this.automata.players.get(packet.guildId);
                if (player)
                    player.emit(packet.op, packet);
                break;
        }
    }
    /** Handles the 'close' event of the WebSocket connection. */
    close(event) {
        this.disconnect();
        this.automata.emit("nodeDisconnect", this, event);
        if (event !== 1000)
            this.reconnect();
    }
    /** Handles the 'error' event of the WebSocket connection. */
    error(event) {
        if (!event)
            return;
        this.automata.emit("nodeError", this, event);
    }
    /** Gets the route planner's current status. */
    async getRoutePlannerStatus() {
        return await this.rest.get(`/v3/routeplanner/status`);
    }
    /** Removes a failed address from the route planner's blacklist. */
    async unmarkFailedAddress(address) {
        return this.rest.post(`/v3/routeplanner/free/address`, { address });
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map