import { AutomataTrack, TrackData } from './Guild/Track';
import { Node, NodeOptions } from './Node/Node';
import { Player } from './Player/Player';
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
	 * @param {Client} client - The client object.
	 * @returns {void}
	 */
	public init(client: Client): void {
		this.userId = client.user.id;
		for (const node of this._nodes) this.addNode(node);

		this.send = (packet: VoicePacket) => {
			const guild = client.guilds.cache.get(packet.d.guild_id);
			guild.shard?.send(packet);
		};

		client.on('raw', (packet: VoicePacket) => {
			this.packetUpdate(packet);
		});

		this.isActivated = true;
	}

	/**
	 * Adds a new node to the node pool.
	 * @param {NodeOptions} options - The options for the new node.
	 * @returns {Node} The newly added node.
	 */
	public addNode({ name, host, password, port }: NodeOptions): Node {
		const node = new Node(this, { name, host, password, port }, this.options);
		this.nodes.set(name, node);
		node.connect();
		return node;
	}

	/**
	 * Removes a node from the node pool.
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
	 * @returns {Node[]} An array of least used nodes.
	 */
	public get leastUsedNodes(): Node[] {
		return [...this.nodes.values()]
			.filter((node) => node.isConnected)
			.sort((a, b) => a.penalties - b.penalties);
	}

	/**
	 * Retrives a node.
	 * @param {string} identifier - The identifier of the node to retrieve. Defaults to 'auto'.
	 * @returns {Node[] | Node} The retrieved node(s).
	 * @throws {Error} If there are no available nodes or the provided node identifier is not found.
	 */
	public getNode(identifier: string): Node[] | Node {
		if (!this.nodes.size) throw new Error('There aren\'t any available nodes.');
		if (identifier === 'auto') return this.leastUsedNodes;

		const node = this.nodes.get(identifier);
		if (!node) throw new Error('Couldn\'t find the provided node identifier.');
		if (!node.isConnected) node.connect();
		return node;
	}

	/**
	 * Creates a new player instance for the specified guild and connects to the least used node based on the provided region or overall system load.
	 * @param {ConnectionOptions} options - The options for creating the player.
	 * @returns {Player} The created player.
	 * @throws {Error} If Automata was not initialized or there are no available nodes.
	 */
	public create(options: ConnectionOptions): Player {
		if (!this.isActivated) throw new Error(
			'Automata was not initialized in your ready event. Please initiate it by using the <AutomataManager>.init function.',
		);

		let player = this.players.get(options.guildId);

		if (!player) {
			if (this.leastUsedNodes.length === 0) throw new Error('There aren\'t any nodes available.');

			const foundNode = this.nodes.get(options.region
				? this.leastUsedNodes.find((node) => node.regions.includes(options.region.toLowerCase()))?.options.name
				: this.leastUsedNodes[0].options.name);

			if (!foundNode) throw new Error('There aren\'t any nodes available.');

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
		if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
		const player = this.players.get(packet.d.guild_id);
		if (!player) return;

		switch (packet.t) {
		case 'VOICE_SERVER_UPDATE':
			// eslint-disable-next-line no-case-declarations
			const serverPacket = packet.d as ServerUpdatePacket;
			if (!serverPacket.endpoint) throw new Error('Automata · No session ID found.');

			player.voice.endpoint = serverPacket.endpoint;
			player.voice.token = serverPacket.token;

			player.node.rest.updatePlayer({
				guildId: player.guildId,
				data: { voice: player.voice },
			});

			break;
		case 'VOICE_STATE_UPDATE':
			// eslint-disable-next-line no-case-declarations
			const voicePacket = packet as VoicePacket;
			if (voicePacket.d.user_id !== this.userId) return;
			if (!voicePacket.d.channel_id) player.destroy();

			if (player?.voiceChannel && voicePacket.d.channel_id && player?.voiceChannel !== voicePacket.d.channel_id)
				player.voiceChannel = voicePacket.d.channel_id;

			player.deaf = voicePacket.d.self_deaf ?? true;
			player.mute = voicePacket.d.self_mute ?? false;
			player.voice.sessionId = voicePacket.d.session_id ?? null;
			break;
		default:
			break;
		}
	}

	/**
	 * Creates a new player using the node and options provided by the create() function.
	 * @private
	 * @param {Node} node - The node to create the player with.
	 * @param {ConnectionOptions} options - THe options for creating the player.
	 * @returns {Player} The created player.
	 */
	private createPlayer(node: Node, options: ConnectionOptions): Player {
		const player = new Player(this, node, options);
		this.players.set(options.guildId, player);
		player.connect(options);
		return player;
	}

	/**
	 * Resolves the provided query.
	 * @param {ResolveOptions} options - The options for resolving the query.
	 * @param {Node} node - The node to use for resolving. Defaults to the least used node.
	 * @returns {Promise<ResolveResult>} A promise that returns the loadType, mapped tracks and playlist info (when possible).
	 * @throws {Error} If Automata has not been initialized or there are no available nodes.
	 */
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

	/**
 	 * Sends a GET request to the Lavalink node to get information regarding the node.
 	 * @param {string} name - The name of the node.
 	 * @returns {Promise<NodeStats>} A promise that resolves to the information regarding the node.
 	 */
	public async getLavalinkInfo(name: string): Promise<NodeStats> {
		const node = this.nodes.get(name);
		const request = await node.rest.get('/v3/stats') as NodeStats;
		return request;
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

export interface VoicePacket {
	/** The name of the event. */
	t?: string;
	d?: {
		/** The ID of the server where the event occured. */
		guild_id?: string;
		/** The ID of the player. */
		user_id?: string;
		/** The ID of the channel that the player is currently connected to. */
		channel_id?: string;
		/** A boolean that indicates if the player has deafened itself. */
		self_deaf?: boolean;
		/** A boolean that indicates if the player has muted itself. */
		self_mute?: boolean;
		/** The ID of the session. */
		session_id?: string;
	}
}

export interface ServerUpdatePacket {
	/** The token of the session. */
	token: string;
	/** The ID of the guild where the event occured. */
	guild_id: string;
	/** The endpoint of the voice server. */
	endpoint: string;
}

interface Client {
    user: {
        id: string;
    };
    guilds: {
        cache: {
            get(guildId: string): {
				shard?: {
					send(packet: VoicePacket): void;
				} | undefined;
			}
        };
    };
    on(eventName: 'raw', callback: (packet: VoicePacket) => void): void;
}

export interface NodeStats {
	players: number;
	playingPlayers: number;
	memory: {
		reservable: number;
		used: number;
		free: number;
		allocated: number;
	};
	frameStats: {
		sent: number;
		deficit: number;
		nulled: number;
	};
	cpu: {
		cores: number;
		systemLoad: number;
		lavalinkLoad: number;
	};
	uptime: number;
}

export interface IVoiceServer {
	/** The endpoint of the voice server. */
  token: string;
  /** The session ID of the voice server. */
  sessionId: string;
  /** The endpoint of the voice server. */
  endpoint: string;
}

export interface StateUpdate {
	/** The ID of the channel that the player is currently connected to. */
	channel_id?: string;
	/** A boolean that indicates if the player has deafened itself. */
	self_deaf?: boolean;
	/** A boolean that indicates if the player has muted itself. */
	self_mute?: boolean;
	/** The ID of the session. */
	session_id?: string;
}
