import { Node } from "./Node/Node";
import { Player } from "./Player/Player";
import { EventEmitter } from "events";
import { Response } from "./guild/Response";
import { Track } from "./guild/Track";

export class Manager extends EventEmitter {
  public readonly client: any;
  public readonly _nodes: NodeOptions[];

  public options: AutomataOptions;
  public nodes: Map<string, Node>;
  public players: Map<string, Player>;

  public userId: string | null;
  public version: string;
  public isActivated: boolean;
  public send: Function | null;

  constructor(client: any, nodes: NodeOptions[], options: AutomataOptions) {
    super();
    this.client = client;
    this._nodes = nodes;
    this.nodes = new Map();
    this.players = new Map();
    this.options = options;
    this.userId = null;
    this.version = "v2.0";
    this.isActivated = false;
    this.send = null;
  }

  /** Initializes the manager. */
  public init(client: any) {
    this.userId = client.user.id;
    for (const node of this._nodes) this.addNode(node);

    this.send = (packet: any) => {
      const guild = client.guilds.cache.get(packet.d.guild_id);
      guild?.shard?.send(packet);
    };

    client.on("raw", (packet: any) => {
      this.packetUpdate(packet);
    });

    this.isActivated = true;
  }

  /** Adds a new node to the node pool. */
  public addNode({ name, host, password, port }: NodeOptions): Node {
    const node = new Node(this, { name, host, password, port }, this.options);
    this.nodes.set(name, node);
    node?.connect?.();
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
  get leastUsedNodes() {
    return [...this.nodes.values()]
    .filter((node) => node.isConnected)
    .sort((a, b) => a.penalties - b.penalties);
  }

  /** Retrives a node. */
  getNode(identifier = "auto") {
    if (!this.nodes.size) throw new Error('There aren\'t any available nodes.');
    if (identifier === "auto") return this.leastUsedNodes;
  
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
      const node = this.nodes.get(this.leastUsedNodes[0].name);
      if(!node) throw new Error("There aren\'t any nodes available.");
    }

    if (this.leastUsedNodes.length === 0) throw new Error("There aren\'t any nodes available.");

    const node = this.nodes.get(options.region
      ? this.leastUsedNodes.find((node) => node.regions.includes(options.region.toLowerCase()))?.name
      : this.leastUsedNodes[0].name);

    if (!node) throw new Error("There aren\'t any nodes available.");

    return this.createPlayer(node, options);
  }

  /** Sends packet updates. */
  public packetUpdate(packet: any) {
    if (!["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(packet.t)) return;
    const player = this.players.get(packet.d.guild_id);
    if (!player) return;

    switch (packet.t) {
      case "VOICE_SERVER_UPDATE":
        player.connection.setServersUpdate(packet.d);
        break;
      case "VOICE_STATE_UPDATE":
        if (packet.d.user_id !== this.userId) return;
        player.connection.setStateUpdate(packet.d);
        if (player.isPaused) player.pause(false);
        break;
      default:
        break;
    }
  }

  /** Creates a new player using the node and options provided by the create() function. */
  private createPlayer(node: Node, options: ConnectionOptions) {
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
  async resolve({ query, source, requester }: ResolveOptions, node?: Node): Promise<Response> {
    if (!this.isActivated) throw new Error('Automata has not been initialized. Initiate Automata using the <Manager>.init() function in your ready.js.');

    node = node ?? this.leastUsedNodes?.[0];
    if (!node) throw Error('There are no available nodes.')

    const regex = /^https?:\/\//;
    const identifier = regex.test(query) ? query : `${source ?? "dzsearch"}:${query}`;

		const response = await node.rest.get(`/v3/loadtracks?identifier=${encodeURIComponent(identifier)}`);
    return new Response(response, requester);
  }

  /** Sends a GET request to the Lavalink node to decode the provided track. */
  decodeTrack(track: string, node?: Node) {
    const targetNode = node ?? this.leastUsedNodes[0];
    return targetNode.rest.get(
      `/v3/decodetrack?encodedTrack=${encodeURIComponent(track)}`
    );
  }

  /** Sends a POST request to the Lavalink node to decode the provided tracks. */
  async decodeTracks(tracks: string[], node?: Node) {
    const targetNode = node ?? this.leastUsedNodes[0];
    return await targetNode.rest.post(`/v3/decodetracks`, tracks);
  }

  /** Sends a GET request to the Lavalink node to get information regarding the node. */
  async getLavalinkInfo(name: string) {
    let node = this.nodes.get(name);
    return await node.rest.get(`/v3/info`);
  }

  /** Sends a GET request to the Lavalink node to get information regarding the status of the node. */
  async getLavalinkStatus(name: string) {
    let node = this.nodes.get(name);
    return await node.rest.get(`/v3/stats`);
  }

  /** Retrieves the player from a server using the provided guildId of the specific server. */
  get(guildId: string) {
    return this.players.get(guildId);
  }
}

export interface NodeOptions {
	/** Name of the node. */
	name: string;
	/** IP of the node. */
	host: string;
	/** Port of the node. */
	port: number;
	/** Password of the node. */
	password: string;
	/** Requires to be set as true when the node has SSL enabled. Otherwise, it can be left disabled. */
	secure?: boolean;
	/** Allows you to set this node to be used across specific regions. */
	region?: string[];
}

export type SearchPlatform = 'spsearch' | 'dzsearch' | 'scsearch';

export interface ResolveOptions {
	/** The query provided by the user. */
	query: string;
	/** The source that will be used to get the song from. */
	source?: SearchPlatform | string;
	/** The requester of the song. */
	requester?: any;
}

export interface AutomataOptions {
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
	 *
	 * @param topic from what section the event come
	 * @param args
	 * Emitted when a Response is come
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
	nodeError: (node: Node, event: any) => void;

	/**
	 * Emitted when a player starts playing a new track.
	 * @eventProperty
	 */
	playerStart: (player: Player, track: Track) => void;

	/**
	 * Emitted when the player finishes playing a track.
	 * @eventProperty
	 */
	playerEnd: (
		player: Player,
		track: Track,
		LavalinkData?: unknown
	) => void;

	/**
	 * Emitted when the player disconnects from the Discord voice channel.
	 * @eventProperty
	 */
	playerDisconnect: (player: Player) => void;

	/**
	 * Emitted when a track gets stuck while it is playing.
	 * @eventProperty
	 */
	playerError: (player: Player, track: Track, data: any) => void;

	/**
	 * Emitted when the connection between the WebSocket and Discord voice servers drops.
	 * @eventProperty
	 */
	playerClose: (player: Player, track: Track, data: any) => void;
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
