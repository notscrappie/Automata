/// <reference types="node" />
import { Node } from "./Node/Node";
import { Player } from "./Player/Player";
import { EventEmitter } from "events";
import { Response } from "./guild/Response";
import { Track } from "./guild/Track";
export declare class Manager extends EventEmitter {
    readonly client: any;
    readonly _nodes: NodeOptions[];
    options: AutomataOptions;
    nodes: Map<string, Node>;
    players: Map<string, Player>;
    userId: string | null;
    version: string;
    isActivated: boolean;
    send: Function | null;
    constructor(client: any, nodes: NodeOptions[], options: AutomataOptions);
    /** Initializes the manager. */
    init(client: any): void;
    /** Adds a new node to the node pool. */
    addNode({ name, host, password, port }: NodeOptions): Node;
    /** Removes a node from the node pool. */
    removeNode(identifier: string): void;
    /** Gets the least used nodes. */
    get leastUsedNodes(): Node[];
    /** Retrives a node. */
    getNode(identifier?: string): Node | Node[];
    /** Creates a new player instance for the specified guild, and connects to the least used node based on the provided region or overall system load. */
    create(options: ConnectionOptions): Player;
    /** Sends packet updates. */
    packetUpdate(packet: any): void;
    /** Creates a new player using the node and options provided by the create() function. */
    private createPlayer;
    /** Removes a connection. */
    removeConnection(guildId: string): void;
    /** Resolves the provided query. */
    resolve({ query, source, requester }: ResolveOptions, node?: Node): Promise<Response>;
    /** Sends a GET request to the Lavalink node to decode the provided track. */
    decodeTrack(track: string, node?: Node): Promise<unknown>;
    /** Sends a POST request to the Lavalink node to decode the provided tracks. */
    decodeTracks(tracks: string[], node?: Node): Promise<unknown>;
    /** Sends a GET request to the Lavalink node to get information regarding the node. */
    getLavalinkInfo(name: string): Promise<unknown>;
    /** Sends a GET request to the Lavalink node to get information regarding the status of the node. */
    getLavalinkStatus(name: string): Promise<unknown>;
    /** Retrieves the player from a server using the provided guildId of the specific server. */
    get(guildId: string): Player;
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
    playerEnd: (player: Player, track: Track, LavalinkData?: unknown) => void;
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
    on<K extends keyof AutomataEvents>(event: K, listener: AutomataEvents[K]): this;
    once<K extends keyof AutomataEvents>(event: K, listener: AutomataEvents[K]): this;
    emit<K extends keyof AutomataEvents>(event: K, ...args: Parameters<AutomataEvents[K]>): boolean;
    off<K extends keyof AutomataEvents>(event: K, listener: AutomataEvents[K]): this;
}
