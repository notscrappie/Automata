import { Manager, AutomataOptions, NodeOptions } from "../Manager";
import WebSocket from "ws";
import { Rest } from "./Rest";
export declare class Node {
    isConnected: boolean;
    automata: Manager;
    readonly name: string;
    readonly restURL: string;
    readonly socketURL: string;
    password: string;
    readonly secure: boolean;
    readonly regions: Array<string>;
    sessionId: string;
    rest: Rest;
    ws: WebSocket | null;
    readonly resumeKey: string | null;
    readonly resumeTimeout: number;
    readonly autoResume: boolean;
    readonly reconnectTimeout: number;
    reconnectTries: number;
    reconnectAttempt: any;
    attempt: number;
    stats: NodeStats | null;
    options: NodeOptions;
    constructor(automata: Manager, node: NodeOptions, options: AutomataOptions);
    /** Connects to the Lavalink server using the WebSocket. */
    connect(): void;
    /** Sends the payload to the Lavalink server. */
    send(payload: any): Promise<void>;
    /** Reconnects the client to the Lavalink server. */
    reconnect(): void;
    /** Disconnects the client from the Lavalink server. */
    disconnect(): Promise<void>;
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
    /** Gets the route planner's current status. */
    getRoutePlannerStatus(): Promise<any>;
    /** Removes a failed address from the route planner's blacklist. */
    unmarkFailedAddress(address: string): Promise<any>;
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
