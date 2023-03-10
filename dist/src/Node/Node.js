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
    connect() {
        if (this.ws)
            this.ws.close();
        const headers = {
            Authorization: this.password,
            "User-Id": this.automata.userId,
            "Client-Name": "sr_client",
        };
        if (this.resumeKey)
            headers["Resume-Key"] = this.resumeKey;
        this.ws = new ws_1.default(this.socketURL, { headers });
        this.ws.on("open", this.open.bind(this));
        this.ws.on("error", this.error.bind(this));
        this.ws.on("message", this.message.bind(this));
        this.ws.on("close", this.close.bind(this));
    }
    send(payload) {
        const data = JSON.stringify(payload);
        this.ws.send(data, (error) => {
            if (error)
                return error;
            return null;
        });
    }
    reconnect() {
        this.reconnectAttempt = setTimeout(() => {
            if (this.attempt > this.reconnectTries) {
                throw new Error(`[Poru Websocket] Unable to connect with ${this.name} node after ${this.reconnectTries} tries`);
            }
            this.isConnected = false;
            this.ws?.removeAllListeners();
            this.ws = null;
            this.automata.emit("nodeReconnect", this);
            this.connect();
            this.attempt++;
        }, this.reconnectTimeout);
    }
    disconnect() {
        if (!this.isConnected)
            return;
        this.automata.players.forEach((player) => {
            if (player.node == this) {
                player.AutoMoveNode();
            }
        });
        this.ws.close(1000, "destroy");
        this.ws?.removeAllListeners();
        this.ws = null;
        //    this.reconnect = 1;
        this.automata.nodes.delete(this.name);
        this.automata.emit("nodeDisconnect", this);
    }
    get penalties() {
        let penalties = 0;
        if (!this.isConnected)
            return penalties;
        penalties += this.stats.players;
        penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);
        if (this.stats.frameStats) {
            penalties += this.stats.frameStats.deficit;
            penalties += this.stats.frameStats.nulled * 2;
        }
        return penalties;
    }
    open() {
        if (this.reconnectAttempt) {
            clearTimeout(this.reconnectAttempt);
            delete this.reconnectAttempt;
        }
        this.automata.emit("nodeConnect", this);
        this.isConnected = true;
        if (this.autoResume) {
            for (const player of this.automata.players.values()) {
                if (player.node === this) {
                    player.restart();
                }
            }
        }
    }
    setStats(packet) {
        this.stats = packet;
    }
    async message(payload) {
        const packet = JSON.parse(payload);
        if (!packet?.op)
            return;
        this.automata.emit("raw", "Node", packet);
        if (packet.op === "stats") {
            delete packet.op;
            this.setStats(packet);
        }
        if (packet.op === "ready") {
            this.rest.setSessionId(packet.sessionId);
            this.sessionId = packet.sessionId;
            if (this.resumeKey) {
                this.rest.patch(`/v3/sessions/${this.sessionId}`, { resumingKey: this.resumeKey, timeout: this.resumeTimeout });
            }
        }
        const player = this.automata.players.get(packet.guildId);
        if (packet.guildId && player)
            player.emit(packet.op, packet);
    }
    close(event) {
        this.disconnect();
        this.automata.emit("nodeDisconnect", this, event);
        if (event !== 1000)
            this.reconnect();
    }
    error(event) {
        if (!event)
            return;
        this.automata.emit("nodeError", this, event);
    }
    async getRoutePlannerStatus() {
        return await this.rest.get(`/v3/routeplanner/status`);
    }
    async unmarkFailedAddress(address) {
        return this.rest.post(`/v3/routeplanner/free/address`, { address });
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map