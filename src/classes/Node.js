const { WebSocket } = require('ws');
const { fetch } = require('undici');

class Node {
	constructor(automata, options, node) {
		this.automata = automata;
		this.name = options.name || null;
		this.host = options.host || 'localhost';
		this.port = options.port || 2333;
		this.password = options.password || 'youshallnotpass';
		this.clientName = 'Lust Project - Automata Client';
		this.secure = options.secure || false;
		this.url = `${this.secure ? 'wss' : 'ws'}://${this.host}:${this.port}/`;
		this.regions = options?.regions || [];
		this.ws = null;
		this.reconnectTimeout = node.reconnectTimeout || 5000;
		this.reconnectTries = node.reconnectTries || 5;
		this.reconnectAttempt = null;
		this.attempt = 0;
		this.resumeKey = node.resumeKey || null;
		this.resumeTimeout = node.resumeTimeout || 60;
		this.reconnects = 0;
		this.isConnected = false;
		this.destroyed = null;
		this.stats = {
			players: 0,
			playingPlayers: 0,
			uptime: 0,
			memory: {
				free: 0,
				used: 0,
				allocated: 0,
				reservable: 0,
			},
			cpu: {
				cores: 0,
				systemLoad: 0,
				lavalinkLoad: 0,
			},
		};
	}

	/**
   * Initiaties a connection to the Lavalink server.
   */
	connect() {
		if (this.ws) this.ws.close();
		const headers = {
			Authorization: this.password,
			'Num-Shards': this.automata?.shards ?? 1,
			'User-Id': this.automata?.user,
			'Client-Name': this.clientName,
			...(this.resumeKey && { 'Resume-Key': this.resumeKey }),
		};

		this.ws = new WebSocket(this.url, { headers });
		this.ws.on('open', () => this.open());
		this.ws.on('error', (error) => this.error(error));
		this.ws.on('message', (message) => this.message(message));
		this.ws.on('close', () => this.close());
	}

	/**
   * Disconnects the client from the Lavalink server.
   */
	disconnect() {
		if (!this.isConnected) return;

		this.ws = null;
		this.isConnected = false;
	}

	/**
   * Destroys the player.
   */
	destroy() {
		const players = this.automata.players.filter((p) => p.node === this);
		players.forEach((p) => p.destroy());
		this.disconnect();
		this.automata.nodes.delete(this.host);
		this.automata.emit('nodeDestroy', this);
	}

	/**
   * Reconnects the client to the Lavalink server.
   */
	reconnect() {
		clearTimeout(this.reconnectTimeout);

		const { reconnectTimeout, reconnectTries } = this;
		this.reconnectAttempt = setTimeout(() => {
			if (this.attempt > reconnectTries)
				throw new TypeError(
					`Automata WS · Unable to establish a connection to node ${this.name} after ${reconnectTries} tries.`,
				);

			this.isConnected = false;
			this.ws?.removeAllListeners();
			this.ws = null;
			this.automata.emit('nodeReconnect', this);
			this.connect();
			this.attempt++;
		}, reconnectTimeout);
	}

	/**
   * Sends the payload data to the Lavalink server.
   */
	send(payload) {
		const data = JSON.stringify(payload);
		this.ws.send(data);
		this.automata.emit('raw', data, this.name);
	}

	/**
   * Handles the 'open' event emitted by the WebSocket client when the connection is opened.
   */
	open() {
		if (this.reconnectAttempt) {
			clearTimeout(this.reconnectAttempt);
			this.reconnectAttempt = null;
		}

		if (this.resumeKey)
			this.send({
				op: 'configureResuming',
				key: this.resumeKey.toString(),
				timeout: this.resumeTimeout,
			});

		this.automata.emit('nodeConnect', this);
		this.isConnected = true;

		const players = new Set(this.automata.players.values());
		const nodePlayers = [...players].filter((player) => player.node === this);
		for (const player of nodePlayers) player.restart();
	}

	/**
  * Handles incoming messages from the Lavalink server.
  * @param {String} payload - The message payload.
  */
	message(payload) {
		const packet = JSON.parse(payload);
		const { op, guildId } = packet ?? {};
		if (!op) return;

		if (packet.op === 'stats') {
			this.stats = { ...packet };
			delete this.stats.op;
		}

		if (guildId && this.automata.players.has(guildId)) {
			const player = this.automata.players.get(packet.guildId);
			player.emit(op, packet);
		}

		packet.node = this;
	}

	/**
   * Ends the connection with the node.
   */
	close(event) {
		this.disconnect();
		this.automata.emit('nodeDisconnect', this, event);
		if (event !== 1000) this.reconnect();
	}

	/**
   * Handles node related errors.
   */
	error(event) {
		if (!event) return;
		this.automata.emit('nodeError', this, event);
	}

	async getRoutePlannerStatus() {
		return await this.makeRequest({
			endpoint: '/routeplanner/status',
			headers: {
				Authorization: this.password,
				'User-Agent': this.clientName,
			},
		});
	}

	async unmarkFailedAddress(address) {
		return await this.makeRequest({
			endpoint: '/routeplanner/free/address',
			method: 'POST',
			headers: {
				Authorization: this.password,
				'User-Agent': this.clientName,
				'Content-Type': 'application/json',

			},
			body: { address },
		});
	}

	async makeRequest(data) {
		const url = new URL(`http${this.secure ? 's' : ''}://${this.host}:${this.port}${data.endpoint}`);
		const options = {
			method: data.method || 'GET',
			headers: data.headers,
		};

		if (data.body) options.body = JSON.stringify(data.body);
		try {
			const response = await fetch(url.toString(), options);
			return await response.json();
		}
		catch (_err) {
			throw new TypeError(`Something went wrong while trying to send a request to ${this.name}. Error: ${_err}`);
		}
	}
}

module.exports = Node;