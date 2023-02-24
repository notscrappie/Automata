const { EventEmitter } = require('events');
const { fetch } = require('undici');
const Player = require('./Player');
const Node = require('./Node');
const Response = require('./Response');
const { checkConnectionOptions } = require('../functions/checkConnectionOptions.js');

class Manager extends EventEmitter {
	constructor(client, nodes, options = {}) {
		super();
		if (!client) throw new TypeError('\'client\' isn\'t a valid object or is undefined.');
		if (!nodes) throw new TypeError('Couldn\'t find any Lavalink nodes. Make sure you defined them in your index.js or config.json file.');

		this.client = client;
		this._nodes = nodes;
		this.nodes = new Map();
		this.players = new Map();
		this.regionMap = new Map();
		this.isActive = false;
		this.user = null;
		this.options = options;
		this.version = 'v1';

		this.sendData = null;
	}

	init(client) {
		if (this.isActive) return this;
		this.user = client.user.id;

		this.sendData = (data) => {
			const guild = client.guilds.cache.get(data.d.guild_id);
			if (guild) guild.shard?.send(data);
		};

		client.on('raw', (packet) => {
			this.packetUpdate(packet);
		});

		for (const node of this._nodes) this.addNode(node);
		this.isActive = true;
	}

	addNode(options) {
		const { name, host } = this.options;
		const node = new Node(this, options, this.options);
		this.nodes.set(name ?? host, node);
		node.connect();
		return node;
	}

	removeNode(identifier) {
		if (!identifier) throw new TypeError('The \'identifier\' parameter was not passed or is undefined.');
		const node = this.nodes.get(identifier);
		if (!node) return;
		node.destroy();
		this.nodes.delete(identifier);
	}

	get leastUsedNodes() {
		const connectedNodes = [];
		for (const node of this.nodes.values()) {
			if (node.isConnected) connectedNodes.push(node);
		}
		connectedNodes.sort((a, b) => a.penalties - b.penalties);
		return connectedNodes;
	}

	getNodeByRegion(region) {
		for (const node of this.nodes.values()) {
			if (node.isConnected && node.regions.includes(region.toLowerCase())) return node;
		}
		return null;
	}

	findNodeByRegion(region) {
		for (const node of this.nodes.values()) {
			if (!node.isConnected) continue;
			if (node.regions.includes(region.toLowerCase())) return node;
		}
		return null;
	}

	getNode(identifier = 'best') {
		if (!this.nodes.size) throw new TypeError('There aren\'t any available nodes.');
		switch (identifier) {
		case 'best':
			if (!this._leastUsedNodes) this._leastUsedNodes = this.leastUsedNodes;
			return this._leastUsedNodes;
		default:
			// eslint-disable-next-line no-case-declarations
			const node = this.nodes.get(identifier);
			if (!node) throw new TypeError('Couldn\'t find the provided node identifier.');
			if (!node.isConnected) node.connect();
			return node;
		}
	}

	create(options) {
		checkConnectionOptions(options);
		const player = this.players.get(options.guildId);
		if (player) return player;

		const [leastUsedNode] = this.leastUsedNodes;
		const node = options.region ? this.regionMap.get(options.region.toLowerCase()) || leastUsedNode : leastUsedNode;

		if (!node) throw new Error('There aren\'t any available nodes.');
		return this.createPlayer(node, options);
	}

	removeConnection(guildId) {
		this.players.get(guildId)?.destroy();
	}

	createPlayer(node, options) {
		const existingPlayer = this.players.get(options.guildId);
		if (existingPlayer) return existingPlayer;
		const player = new Player(this, node, options);
		this.players.set(options.guildId, player);
		player.connect();
		return player;
	}

	packetUpdate(packet) {
		if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t))
			return;
		const player = this.players.get(packet.d.guild_id);
		if (!player) return;

		if (packet.t === 'VOICE_SERVER_UPDATE')
			player.connection.setServersUpdate(packet.d);
		if (packet.t === 'VOICE_STATE_UPDATE') {
			if (packet.d.user_id !== this.user) return;
			player.connection.setStateUpdate(packet.d);
		}
	}

	resolve(query, source) {
		const node = this.leastUsedNodes[0];
		if (!node) throw new Error('No nodes are available.');
		const regex = /^https?:\/\//;

		if (regex.test(query)) return this.fetchURL(node, query);
		else return this.fetchTrack(node, query, source);
	}

	async fetchURL(node, track) {
		const result = await this.fetch(
			node,
			'loadtracks',
			`identifier=${encodeURIComponent(track)}`,
		);
		if (!result) throw new TypeError('No tracks could be found.');
		return new Response(result);
	}

	async fetchTrack(node, query, source) {
		const track = `${source}:${query}`;
		const result = await this.fetch(
			node,
			'loadtracks',
			`identifier=${encodeURIComponent(track)}`,
		);
		if (!result) throw new TypeError('No tracks could be found.');
		return new Response(result);
	}

	async decodeTrack(track) {
		const node = this.leastUsedNodes[0];
		if (!node) throw new TypeError('There aren\'t any available nodes.');
		const result = await this.fetch(node, 'decodetrack', `track=${track}`);
		if (result.status === 500) return null;
		return result;
	}

	async fetch(node, endpoint, param, retries = 3) {
		try {
			const url = `http${node.secure ? 's' : ''}://${node.host}:${node.port}/${endpoint}?${param}`;
			const response = await fetch(url, { headers: { Authorization: node.password } });
			const result = await response.json();
			if (response.ok) return result;
		}

		catch (_err) {
			if (retries > 0) {
				console.warn(`An errors has occured during the fetching process: ${_err.message}. Retrying in 5 seconds.`);
				await new Promise(resolve => setTimeout(resolve, 1000));
				return this.fetch(node, endpoint, param, retries - 1);
			}
			else throw new TypeError(`Failed to connect to the Lavalink server: ${_err.message}`);
		}
	}

	get(guildId) {
		return this.players.get(guildId);
	}
}

module.exports = Manager;
