"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const Response_1 = require("./Guild/Response");
const Player_1 = require("./Player/Player");
const events_1 = require("events");
const Node_1 = require("./Node/Node");
class Manager extends events_1.EventEmitter {
    client;
    _nodes;
    options;
    nodes;
    players;
    userId;
    version;
    isActivated;
    send;
    constructor(client, nodes, options) {
        super();
        this.client = client;
        this._nodes = nodes;
        this.nodes = new Map();
        this.players = new Map();
        this.options = options;
        this.userId = null;
        this.version = 'v2.1';
        this.isActivated = false;
        this.send = null;
    }
    /** Initializes the manager. */
    init(client) {
        this.userId = client.user.id;
        for (const node of this._nodes)
            this.addNode(node);
        this.send = (packet) => {
            const guild = client.guilds.cache.get(packet.d.guild_id);
            guild?.shard?.send(packet);
        };
        client.on('raw', (packet) => {
            this.packetUpdate(packet);
        });
        this.isActivated = true;
    }
    /** Adds a new node to the node pool. */
    addNode({ name, host, password, port }) {
        const node = new Node_1.Node(this, { name, host, password, port }, this.options);
        this.nodes.set(name, node);
        node?.connect?.();
        return node;
    }
    /** Removes a node from the node pool. */
    removeNode(identifier) {
        const node = this.nodes.get(identifier);
        if (!node)
            return;
        node.disconnect();
        this.nodes.delete(identifier);
    }
    /** Gets the least used nodes. */
    get leastUsedNodes() {
        return [...this.nodes.values()]
            .filter((node) => node.isConnected)
            .sort((a, b) => a.penalties - b.penalties);
    }
    /** Retrives a node. */
    getNode(identifier = 'auto') {
        if (!this.nodes.size)
            throw new Error('There aren\'t any available nodes.');
        if (identifier === 'auto')
            return this.leastUsedNodes;
        const node = this.nodes.get(identifier);
        if (!node)
            throw new Error('Couldn\'t find the provided node identifier.');
        if (!node.isConnected)
            node.connect();
        return node;
    }
    /** Creates a new player instance for the specified guild, and connects to the least used node based on the provided region or overall system load. */
    create(options) {
        if (!this.isActivated)
            throw new Error('Automata was not initialized in your ready event. Please initiate it by using the <AutomataManager>.init function.');
        const player = this.players.get(options.guildId);
        if (player) {
            const node = this.nodes.get(this.leastUsedNodes[0].name);
            if (!node)
                throw new Error('There aren\'t any nodes available.');
        }
        if (this.leastUsedNodes.length === 0)
            throw new Error('There aren\'t any nodes available.');
        const foundNode = this.nodes.get(options.region
            ? this.leastUsedNodes.find((node) => node.regions.includes(options.region.toLowerCase()))?.name
            : this.leastUsedNodes[0].name);
        if (!foundNode)
            throw new Error('There aren\'t any nodes available.');
        return this.createPlayer(foundNode, options);
    }
    /** Sends packet updates. */
    packetUpdate(packet) {
        if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t))
            return;
        const player = this.players.get(packet.d.guild_id);
        if (!player)
            return;
        switch (packet.t) {
            case 'VOICE_SERVER_UPDATE':
                player.connection.setServersUpdate(packet.d);
                break;
            case 'VOICE_STATE_UPDATE':
                if (packet.d.user_id !== this.userId)
                    return;
                player.connection.setStateUpdate(packet.d);
                if (player.isPaused)
                    player.pause(false);
                break;
            default:
                break;
        }
    }
    /** Creates a new player using the node and options provided by the create() function. */
    createPlayer(node, options) {
        const player = new Player_1.Player(this, node, options);
        this.players.set(options.guildId, player);
        player.connect(options);
        return player;
    }
    /** Removes a connection. */
    removeConnection(guildId) {
        this.players.get(guildId)?.destroy();
    }
    /** Resolves the provided query. */
    async resolve({ query, source, requester }, node) {
        if (!this.isActivated)
            throw new Error('Automata has not been initialized. Initiate Automata using the <Manager>.init() function in your ready.js.');
        node = node ?? this.leastUsedNodes?.[0];
        if (!node)
            throw Error('There are no available nodes.');
        const regex = /^https?:\/\//;
        const identifier = regex.test(query) ? query : `${source ?? 'dzsearch'}:${query}`;
        const response = await node.rest.get(`/v3/loadtracks?identifier=${encodeURIComponent(identifier)}`);
        return new Response_1.Response(response, requester);
    }
    /** Sends a GET request to the Lavalink node to decode the provided track. */
    decodeTrack(track, node) {
        const targetNode = node ?? this.leastUsedNodes[0];
        return targetNode.rest.get(`/v3/decodetrack?encodedTrack=${encodeURIComponent(track)}`);
    }
    /** Sends a POST request to the Lavalink node to decode the provided tracks. */
    async decodeTracks(tracks, node) {
        const targetNode = node ?? this.leastUsedNodes[0];
        return await targetNode.rest.post('/v3/decodetracks', tracks);
    }
    /** Sends a GET request to the Lavalink node to get information regarding the node. */
    async getLavalinkInfo(name) {
        const node = this.nodes.get(name);
        return await node.rest.get('/v3/info');
    }
    /** Sends a GET request to the Lavalink node to get information regarding the status of the node. */
    async getLavalinkStatus(name) {
        const node = this.nodes.get(name);
        return await node.rest.get('/v3/stats');
    }
    /** Retrieves the player from a server using the provided guildId of the specific server. */
    get(guildId) {
        return this.players.get(guildId);
    }
}
exports.Manager = Manager;
//# sourceMappingURL=Manager.js.map