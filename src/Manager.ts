import {
	AutomataOptions,
	Client,
	ConnectionOptions,
	LavalinkResponse,
	PlaylistData,
	ResolveOptions,
	ResolveResult,
	ServerUpdatePacket,
	VoicePacket,
} from './Interfaces/ManagerInterfaces';
import { TrackData } from './Interfaces/TrackInterfaces';
import { NodeOptions, NodeStats } from './Utils/Utils';
import { AutomataTrack, Node, Player } from '../index';
import { EventEmitter } from 'events';

/** The main hub for interacting with Lavalink via Automata. (shit taken from erela.js's repo, rip erela) */
export class Manager extends EventEmitter {
	private readonly _nodes: NodeOptions[];

	/** The configuration options for the Manager. */
	public options: AutomataOptions;
	/** A map of node identifiers to Node instances. */
	public nodes: Map<string, Node>;
	/** A map of guild IDs to Player instances. */
	public players: Map<string, Player>;
	/** The ID of the bot. */
	public userId: string | null;
	/** The boolean indicating if the manager has been initialized or not. */
	private isActivated: boolean;
	/**
	 * The function used to send packets.
	 * @param {object} packet - The packet that needs to be sent.
	 * @returns {void}
	 */
	public send: (packet: object) => void;

	constructor(options: AutomataOptions) {
		super();
		this.nodes = new Map();
		this.players = new Map();

		this.options = options;
		this.isActivated = false;
		this._nodes = options.nodes;
	}

	/**
	 * Initializes the manager.
	 * @public
	 * @param {client} client The client object.
	 * @returns {this}
	 */
	public init(client: Client): this {
		this.userId = client.user.id;
		for (const node of this._nodes) this.addNode(node);

		this.send = (packet: VoicePacket) => {
			const guild = client.guilds.cache.get(packet.d.guild_id);
			guild?.shard?.send(packet);
		};

		client.on('raw', (packet: VoicePacket) => {
			this.packetUpdate(packet);
		});

		this.isActivated = true;
		return this;
	}

	/**
	 * Adds a new node to the node pool.
	 * @public
	 * @param {NodeOptions} options - The options for the new node.
	 * @returns {Node} The newly added node.
	 */
	public addNode(options: NodeOptions): Node {
		const node = new Node(this, options, this.options);
		this.nodes.set(options.name, node);
		node.connect();
		return node;
	}

	/**
	 * Removes a node from the node pool.
	 * @public
	 * @param {string} identifier - The identifier of the node that will be removed.
	 * @returns {void}
	 */
	public removeNode(identifier: string): void {
		const node = this.nodes.get(identifier);
		if (!node) return;
		node.disconnect();
		this.nodes.delete(identifier);
	}

	/**
	 * Gets the least used nodes.
	 * @public
	 * @returns {Node[]} An array of least used nodes.
	 */
	public get leastUsedNodes(): Node[] {
		return [...this.nodes.values()]
			.filter((node) => node.isConnected)
			.sort((a, b) => a.penalties - b.penalties);
	}

	/**
	 * Retrieves a node.
	 * @param {string} identifier - The identifier of the node to retrieve. Defaults to 'auto'.
	 * @returns {Node[] | Node} The retrieved node(s).
	 * @throws {Error} If there are no available nodes or the provided node identifier is not found.
	 */
	public getNode(identifier: string): Node[] | Node {
		if (!this.nodes.size) throw new Error('Automata Error · There aren\'t any available nodes.');
		if (identifier === 'auto') return this.leastUsedNodes;

		const node = this.nodes.get(identifier);
		if (!node) throw new Error('Automata Error · Couldn\'t find the provided node identifier.');
		if (!node.isConnected) node.connect();
		return node;
	}

	/**
	 * Creates a new player instance for the specified guild and connects to the least used node based on the provided region or overall system load.
	 * @public
	 * @param {ConnectionOptions} options - The options for creating the player.
	 * @returns {Player} The created player.
	 * @throws {Error} If Automata was not initialized or there are no available nodes.
	 */
	public create(options: ConnectionOptions): Player {
		if (!this.isActivated) throw new Error(
			'Automata Error · Automata was not initialized in your ready event. Please initiate it by using the <AutomataManager>.init function.',
		);

		let player = this.players.get(options.guildId);

		if (!player) {
			if (this.leastUsedNodes.length === 0) throw new Error('Automata Error · There aren\'t any nodes available.');

			const foundNode = this.nodes.get(options.region
				? this.leastUsedNodes.find((node) => node.regions.includes(options.region.toLowerCase()))?.options.name
				: this.leastUsedNodes[0].options.name);

			if (!foundNode) throw new Error('Automata Error · There aren\'t any nodes available.');

			player = this.createPlayer(foundNode, options);
		}

		return player;
	}

	/**
	 * Sends packet updates.
	 * @private
	 * @param {VoicePacket} packet - The voice packet that is received.
	 * @returns {void}
	 */
	private packetUpdate(packet: VoicePacket): void {
		const packetTypes = new Set(['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE']);
		if (!packetTypes.has(packet.t)) return;

		const player = this.players.get(packet.d.guild_id);
		if (!player) return;

		const serverPacket = packet.d as ServerUpdatePacket;
		switch (packet.t) {
		case 'VOICE_SERVER_UPDATE':
			return this.handleVServerUpdate(player, serverPacket);
		case 'VOICE_STATE_UPDATE':
			return this.handleVStateUpdate(player, packet);
		default:
			break;
		}
	}

	/**
	 * Handles voice server updates.
	 * @private
	 * @param player The player.
	 * @param serverPacket The voice packet.
	 * @returns {void}
	 */
	private handleVServerUpdate(player: Player, serverPacket: ServerUpdatePacket): void {
		if (!serverPacket.endpoint) throw new Error('Automata Error · No session ID found.');

		player.voice.endpoint = serverPacket.endpoint;
		player.voice.token = serverPacket.token;

		player.node.rest.updatePlayer({
			guildId: player.guildId,
			data: { voice: player.voice },
		});
	}

	/**
	 * Handles voice server updates.
	 * @private
	 * @param player The player.
	 * @param voicePacket The voice packet.
	 * @returns {void}
	 */
	private handleVStateUpdate(player: Player, voicePacket: VoicePacket): void {
		if (voicePacket.d.user_id !== this.userId) return;
		if (!voicePacket.d.channel_id) return player.destroy();

		if (player?.voiceChannel && voicePacket.d.channel_id && player?.voiceChannel !== voicePacket.d.channel_id)
			player.voiceChannel = voicePacket.d.channel_id;

		player.options.deaf = voicePacket.d.self_deaf ?? true;
		player.options.mute = voicePacket.d.self_mute ?? false;
		player.voice.sessionId = voicePacket.d.session_id ?? null;

		if (player.isPaused) player.pause(false);
	}

	/**
	 * Creates a new player using the node and options provided by the create() function.
	 * @private
	 * @param {Node} node - The node to create the player with.
	 * @param {ConnectionOptions} options - The options for creating the player.
	 * @returns {Player} The created player.
	 */
	private createPlayer(node: Node, options: ConnectionOptions): Player {
		const player = new Player(this, node, options);
		this.players.set(options.guildId, player);
		player.connect();
		return player;
	}

	/**
	 * Resolves the provided query.
	 * @param {ResolveOptions} options The options for resolving the query.
	 * @param {Node} node The node to use for resolving. Defaults to the least used node.
	 * @returns {Promise<ResolveResult>} A promise that returns the loadType, mapped tracks and playlist info (when possible).
	 * @throws {Error} If Automata has not been initialized or there are no available nodes.
	 */
	public async resolve({ query, source, requester }: ResolveOptions, node: Node = this.leastUsedNodes?.[0]): Promise<ResolveResult> {
		if (!this.isActivated) throw new Error('Automata Error · Automata has not been initialized. Initiate Automata using the <Manager>.init() function in your ready.js.');
		if (!node) throw Error('Automata Error · There are no available nodes.');

		const identifier = /^https?:\/\//.test(query) ? query : `${source ?? 'dzsearch'}:${query}`;
		const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`) as LavalinkResponse;

		const mappedTracks: AutomataTrack[] = [];
		let track: AutomataTrack;
		let data: TrackData | PlaylistData;
		let playlist: AutomataTrack[];

		switch (res.loadType) {
		case 'track':
			data = res.data as TrackData;
			track = new AutomataTrack(data, requester);
			mappedTracks.push(track);
			break;
		case 'playlist':
			data = res.data as PlaylistData;
			playlist = data.tracks.map((newTrack) => new AutomataTrack(newTrack, requester));
			mappedTracks.push(...playlist);
			break;
		default:
			break;
		}

		return {
			loadType: res.loadType,
			tracks: mappedTracks,
			playlist: res.loadType === 'playlist' ? res.data as PlaylistData : undefined,
		};
	}

	/**
 	 * Sends a GET request to the Lavalink node to get information regarding the node.
 	 * @param {string} name - The name of the node.
 	 * @returns {Promise<NodeStats>} A promise that resolves to the information regarding the node.
 	 */
	public async getLavalinkInfo(name: string): Promise<NodeStats> {
		const node = this.nodes.get(name);
		const request = await node.rest.get('/v4/stats') as NodeStats;
		return request;
	}
}
