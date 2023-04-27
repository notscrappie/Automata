import { Manager, AutomataOptions } from '../Manager';
import { Rest } from './Rest';
export declare class Node {
    private readonly automata;
    readonly options: NodeOptions;
    restURL: string;
    private readonly socketURL;
    isConnected: boolean;
    readonly password: string;
    secure: boolean;
    readonly regions: Array<string>;
    sessionId: string | null;
    readonly rest: Rest;
    private ws;
    private readonly resumeKey;
    private readonly resumeTimeout;
    private readonly autoResume;
    private readonly reconnectTimeout;
    private readonly reconnectTries;
    private reconnectAttempt;
    private attempt;
    stats: NodeStats | null;
    constructor(automata: Manager, node: NodeOptions, options: AutomataOptions);
    /** Connects to the Lavalink server using the WebSocket. */
    connect(): void;
    /** Sends the payload to the Lavalink server. */
    send(payload: unknown): void;
    /** Reconnects the client to the Lavalink server. */
    reconnect(): void;
    /** Disconnects the client from the Lavalink server. */
    disconnect(): void;
    /** Returns the penalty of the current node based on its statistics. */
    get penalties(): number;
    /** Handles the 'open' event of the WebSocket connection. */
    private open;
    /** Sets the stats. */
    private setStats;
    /** Handles the message received from the Lavalink node. */
    private message;
    /** Handles the 'close' event of the WebSocket connection. */
    private close;
    /** Handles the 'error' event of the WebSocket connection. */
    private error;
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
interface NodeStats {
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
export {};
