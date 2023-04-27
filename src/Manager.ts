import { AutomataTrack, TrackData } from './Guild/Track';
import { Node, NodeOptions } from './Node/Node';
import { Player } from './Player/Player';
import { EventEmitter } from 'events';
import { Client } from 'discord.js';

export class Manager extends EventEmitter {
	public readonly client: Client;
	public readonly _nodes: NodeOptions[];

	public options: AutomataOptions;
	public nodes: Map<string, Node>;
	public players: Map<string, Player>;

	public userId: string | null;
	public version: string;
	public isActivated: boolean;
	public send: (_: unknown) => void;

	constructor(options: AutomataOptions) {
		super();
		this._nodes = options.nodes;
		this.nodes = new Map();
		this.players = new Map();
		this.options = options;
		this.version = 'v2.1';
		this.isActivated = false;
	}

	/** Initializes the manager. */
	public init(client: Client): void {
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
	}

	/** Adds a new node to the node pool. */
	public addNode({ name, host, password, port }: NodeOptions): Node {
		const node = new Node(this, { name, host, password, port }, this.options);
		this.nodes.set(name, node);
		node?.connect();
		return node;
	}

	/** Removes a node from the node pool. */
	public removeNode(identifier: string) {
		const node = this.nodes.get(identifier);
		if (!node) return;
		node.disconnect();
		this.nodes.delete(identifier);
	}

	/** Gets the least used nodes. */
	public get leastUsedNodes(): Node[] {
		return [...this.nodes.values()]
			.filter((node) => node.isConnected)
			.sort((a, b) => a.penalties - b.penalties);
	}

	/** Retrives a node. */
	public getNode(identifier = 'auto'): Node[] | Node {
		if (!this.nodes.size) throw new Error('There aren\'t any available nodes.');
		if (identifier === 'auto') return this.leastUsedNodes;

		const node = this.nodes.get(identifier);
		if (!node) throw new Error('Couldn\'t find the provided node identifier.');
		if (!node.isConnected) node.connect();
		return node;
	}

	/** Creates a new player instance for the specified guild, and connects to the least used node based on the provided region or overall system load. */
	public create(options: ConnectionOptions): Player {
		if (!this.isActivated) throw new Error(
			'Automata was not initialized in your ready event. Please initiate it by using the <AutomataManager>.init function.',
		);

		const player = this.players.get(options.guildId);
		if (player) {
			const node = this.nodes.get(this.leastUsedNodes[0].options.name);
			if (!node) throw new Error('There aren\'t any nodes available.');
		}

		if (this.leastUsedNodes.length === 0) throw new Error('There aren\'t any nodes available.');

		const foundNode = this.nodes.get(options.region
			? this.leastUsedNodes.find((node) => node.regions.includes(options.region.toLowerCase()))?.options.name
			: this.leastUsedNodes[0].options.name);

		if (!foundNode) throw new Error('There aren\'t any nodes available.');

		return this.createPlayer(foundNode, options);
	}

	/** Sends packet updates. */
	private packetUpdate(packet: VoicePacket) {
		if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
		const player = this.players.get(packet.d.guild_id);
		if (!player) return;

		switch (packet.t) {
		case 'VOICE_SERVER_UPDATE':
			player.connection.setServersUpdate(packet.d);
			break;
		case 'VOICE_STATE_UPDATE':
			if (packet.d.user_id !== this.userId) return;
			player.connection.setStateUpdate(packet.d);
			if (player.isPaused) player.pause(false);
			break;
		default:
			break;
		}
	}

	/** Creates a new player using the node and options provided by the create() function. */
	private createPlayer(node: Node, options: ConnectionOptions): Player {
		const player = new Player(this, node, options);
		this.players.set(options.guildId, player);
		player.connect(options);
		return player;
	}

	/** Removes a connection. */
	public removeConnection(guildId: string) {
		this.players.get(guildId)?.destroy();
	}

	/** Resolves the provided query. */
	public async resolve({ query, source, requester }: ResolveOptions, node?: Node): Promise<ResolveResult> {
		if (!this.isActivated) throw new Error('Automata has not been initialized. Initiate Automata using the <Manager>.init() function in your ready.js.');

		node = node ?? this.leastUsedNodes?.[0];
		if (!node) throw Error('There are no available nodes.');

		const regex = /^https?:\/\//;
		const identifier = regex.test(query) ? query : `${source ?? 'dzsearch'}:${query}`;

		const res = await node.rest.get(`/v3/loadtracks?identifier=${encodeURIComponent(identifier)}`) as LavalinkResponse;
		const mappedTracks = res.tracks.map((track: TrackData) => new AutomataTrack(track, requester)) || [];
		const finalResult: ResolveResult = {
			loadType: res.loadType,
			tracks: mappedTracks,
			playlistInfo: res.playlistInfo || undefined,
		};

		return finalResult;
	}

	/** Sends a GET request to the Lavalink node to decode the provided track. */
	async decodeTrack(track: string, node?: Node): Promise<unknown> {
		const targetNode = node ?? this.leastUsedNodes[0];
		const request = await targetNode.rest.get(
			`/v3/decodetrack?encodedTrack=${encodeURIComponent(track)}`);
		return request;
	}

	/** Sends a POST request to the Lavalink node to decode the provided tracks. */
	async decodeTracks(tracks: string[], node?: Node): Promise<unknown> {
		const targetNode = node ?? this.leastUsedNodes[0];
		const request = await targetNode.rest.post('/v3/decodetracks', tracks);
		return request;
	}

	/** Sends a GET request to the Lavalink node to get information regarding the node. */
	async getLavalinkInfo(name: string): Promise<unknown> {
		const node = this.nodes.get(name);
		const request = await node.rest.get('/v3/info');
		return request;
	}

	/** Sends a GET request to the Lavalink node to get information regarding the status of the node. */
	async getLavalinkStatus(name: string): Promise<unknown> {
		const node = this.nodes.get(name);
		const request = await node.rest.get('/v3/stats');
		return request;
	}

	/** Retrieves the player from a server using the provided guildId of the specific server. */
	get(guildId: string) {
		return this.players.get(guildId);
	}
}

interface PlaylistInfo {
	name: string;
	selectedTrack?: number;
}

interface ResolveResult {
	loadType: LoadType;
	tracks: AutomataTrack[];
	playlistInfo?: PlaylistInfo;
}

interface LavalinkResponse {
	tracks: TrackData[];
	loadType: LoadType;
	playlistInfo?: PlaylistInfo;
}

type LoadType =
	| 'TRACK_LOADED'
	| 'PLAYLIST_LOADED'
	| 'SEARCH_RESULT'
	| 'NO_MATCHES'
	| 'LOAD_FAILED'

type SearchPlatform = 'spsearch' | 'dzsearch' | 'scsearch';

interface ResolveOptions {
	/** The query provided by the user. */
	query: string;
	/** The source that will be used to get the song from. */
	source?: SearchPlatform | string;
	/** The requester of the song. */
	requester?: unknown;
}

export interface AutomataOptions {
	/** The nodes the player will use. */
	nodes: NodeOptions[];
	/** The default platform used by the manager. Default platform is Deezer, by default. */
	defaultPlatform?: SearchPlatform | string;
	/** The time the manager will wait before trying to reconnect to a node. */
	reconnectTimeout?: number;
	/** The amount of times the player will try to reconnect to a node. */
	reconnectTries?: number;
	/** The key used to resume the previous session. */
	resumeKey?: string;
	/** The time the manager will wait before trying to resume the previous session. */
	resumeTimeout?: number;
}

export interface ConnectionOptions {
	/** The ID of the guild where the player will be created. */
	guildId?: string;
	/** The ID of the guild's voice channel where the player will be created. */
	voiceChannel?: string;
	/** The ID of the guild's text channel where the player will send track related messages. */
	textChannel?: string;
	/** If you want the bot to be deafened on join, set this to true. Default is true. */
	deaf?: boolean;
	/** If you want the bot to be muted on join, set this to true. Default is false. */
	mute?: boolean;
	/** The RTC region of the voice channel. */
	region?: string;
}

export interface AutomataEvents {
	/**
	 * @param topic
	 * @param args
	 * Provides access to raw WS events. Can be used to handle custom or unknown events.
	 * @eventProperty
	 */
	raw: (topic: string, ...args: unknown[]) => void;

	/**
	 * Emitted when Automata successfully connects to a Lavalink node.
	 * @eventProperty
	 */
	nodeConnect: (node: Node) => void;

	/**
	 * Emitted when Automata loses the connection to a Lavalink node.
	 * @eventProperty
	 */
	nodeDisconnect: (node: Node, event?: unknown) => void;

	/**
	 * Emitted when Automata successfully reconnects to a Lavalink node.
	 * @eventProperty
	 */
	nodeReconnect: (node: Node) => void;

	/**
	 * Emitted when a Lavalink node related error occurs.
	 * @eventProperty
	 */
	nodeError: (node?: Node, event?: unknown) => void;

	/**
	 * Emitted when a player starts playing a new track.
	 * @eventProperty
	 */
	trackStart: (player: Player, track: AutomataTrack) => void;

	/**
	 * Emitted when the player finishes playing a track.
	 * @eventProperty
	 */
	trackEnd: (
		player: Player,
		track: AutomataTrack,
		LavalinkData?: unknown
	) => void;

	/**
	 * Emitted when the player's queue has finished.
	 * @eventProperty
	 */
	queueEnd: (player: Player) => void;

	/**
	 * Emitted when a track gets stuck while it is playing.
	 * @eventProperty
	 */
	trackStuck: (player: Player, track: AutomataTrack, data: unknown) => void;

	/**
   	 * Emitted when the player gets updated.
   	 * @eventProperty
   	 */
	playerUpdate: (player: Player) => void;

	/**
   	 * Emitted when a player gets destroyed.
   	 * @eventProperty
     */
	playerDestroy: (player: Player) => void;

	/**
	 * Emitted when the connection between the WebSocket and Discord voice servers drops.
	 * @eventProperty
	 */
	socketClose: (player: Player, track: AutomataTrack, data: unknown) => void;
}

export declare interface Manager {
	on<K extends keyof AutomataEvents>(
		event: K,
		listener: AutomataEvents[K]
	): this;
	once<K extends keyof AutomataEvents>(
		event: K,
		listener: AutomataEvents[K]
	): this;
	emit<K extends keyof AutomataEvents>(
		event: K,
		...args: Parameters<AutomataEvents[K]>
	): boolean;
	off<K extends keyof AutomataEvents>(
		event: K,
		listener: AutomataEvents[K]
	): this;
}

interface VoicePacket {
  op: number;
  t: string;
  d: {
    guild_id: string;
    user_id: string;
    endpoint: string;
    token: string;
  }
}
