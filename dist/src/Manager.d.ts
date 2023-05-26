/// <reference types="node" />
import { AutomataTrack } from './Guild/Track';
import { Node, NodeOptions } from './Node/Node';
import { Player } from './Guild/Player';
import { EventEmitter } from 'events';
/** The main hub for interacting with Lavalink via Automata. (shit taken from erela.js's repo, rip erela) */
export declare class Manager extends EventEmitter {
    private readonly _nodes;
    /** The configuration options for the Manager. */
    options: AutomataOptions;
    /** A map of node identifiers to Node instances. */
    nodes: Map<string, Node>;
    /** A map of guild IDs to Player instances. */
    players: Map<string, Player>;
    /** The ID of the bot. */
    userId: string | null;
    /** A boolean indicating if the library has been initialized or not. */
    private isActivated;
    /**
     * The function used to send packets.
     * @param {object} packet - The packet that needs to be sent.
     * @returns {void}
     */
    send: (packet: object) => void;
    constructor(options: AutomataOptions);
    /**
     * Initializes the manager.
     * @param {Client} client - The client object.
     * @returns {void}
     */
    init(client: Client): void;
    /**
     * Adds a new node to the node pool.
     * @param {NodeOptions} options - The options for the new node.
     * @returns {Node} The newly added node.
     */
    addNode({ name, host, password, port }: NodeOptions): Node;
    /**
     * Removes a node from the node pool.
     * @param {string} identifier - The identifier of the node that will be removed.
     * @returns {void}
     */
    removeNode(identifier: string): void;
    /**
     * Gets the least used nodes.
     * @returns {Node[]} An array of least used nodes.
     */
    get leastUsedNodes(): Node[];
    /**
     * Retrives a node.
     * @param {string} identifier - The identifier of the node to retrieve. Defaults to 'auto'.
     * @returns {Node[] | Node} The retrieved node(s).
     * @throws {Error} If there are no available nodes or the provided node identifier is not found.
     */
    getNode(identifier: string): Node[] | Node;
    /**
     * Creates a new player instance for the specified guild and connects to the least used node based on the provided region or overall system load.
     * @param {ConnectionOptions} options - The options for creating the player.
     * @returns {Player} The created player.
     * @throws {Error} If Automata was not initialized or there are no available nodes.
     */
    create(options: ConnectionOptions): Player;
    /**
     * Sends packet updates.
     * @private
     * @param {VoicePacket} packet - The voice packet that is received.
     * @returns {void}
     */
    private packetUpdate;
    /**
     * Creates a new player using the node and options provided by the create() function.
     * @private
     * @param {Node} node - The node to create the player with.
     * @param {ConnectionOptions} options - THe options for creating the player.
     * @returns {Player} The created player.
     */
    private createPlayer;
    /**
     * Removes a connection.
     * @param {string} guildId - The ID of the guild to remove the connection from.
     * @returns {void}
     */
    removeConnection(guildId: string): void;
    /**
     * Resolves the provided query.
     * @param {ResolveOptions} options - The options for resolving the query.
     * @param {Node} node - The node to use for resolving. Defaults to the least used node.
     * @returns {Promise<ResolveResult>} A promise that returns the loadType, mapped tracks and playlist info (when possible).
     * @throws {Error} If Automata has not been initialized or there are no available nodes.
     */
    resolve({ query, source, requester }: ResolveOptions, node?: Node): Promise<ResolveResult>;
    /**
     * Sends a GET request to the Lavalink node to decode the provided track.
     * @param {string} track - The track to decode.
     * @param {Node} node - The node to send the request to. Defaults to the least used node.
     * @returns {Promise<unknown>} A promise that resolves to the decoded track.
     */
    decodeTrack(track: string, node?: Node): Promise<unknown>;
    /**
     * Sends a POST request to the Lavalink node to decode the provided tracks.
     * @param {string[]} tracks - The tracks to decode.
     * @param {Node} node - The node to send the request to. Defaults to the least used node.
     * @returns {Promise<unknown>} A promise that resolves to the decoded tracks.
     */
    decodeTracks(tracks: string[], node?: Node): Promise<unknown>;
    /**
     * Sends a GET request to the Lavalink node to get information regarding the node.
     * @param {string} name - The name of the node.
     * @returns {Promise<unknown>} A promise that resolves to the information regarding the node.
     */
    getLavalinkInfo(name: string): Promise<unknown>;
    /**
     * Sends a GET request to the Lavalink node to get information regarding the status of the node.
     * @param {string} name - The name of the node.
     * @returns {Promise<unknown>} A promise that resolves to the status information of the node.
     */
    getLavalinkStatus(name: string): Promise<unknown>;
    /**
     * Retrieves the player from a server using the provided guildId of the specific server.
     * @param {string} guildId - The ID of the guild.
     * @returns {Player | undefined} The retrieved player or undefined if not found.
     */
    get(guildId: string): Player | undefined;
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
type LoadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';
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
    trackEnd: (player: Player, track: AutomataTrack, LavalinkData?: unknown) => void;
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
    on<K extends keyof AutomataEvents>(event: K, listener: AutomataEvents[K]): this;
    once<K extends keyof AutomataEvents>(event: K, listener: AutomataEvents[K]): this;
    emit<K extends keyof AutomataEvents>(event: K, ...args: Parameters<AutomataEvents[K]>): boolean;
    off<K extends keyof AutomataEvents>(event: K, listener: AutomataEvents[K]): this;
}
interface VoicePacket {
    op: number;
    t: string;
    d: {
        guild_id: string;
        user_id: string;
        endpoint: string;
        token: string;
    };
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
            };
        };
    };
    on(eventName: 'raw', callback: (packet: VoicePacket) => void): void;
}
export {};
