import { Node } from './Node';
import { Manager } from '../Manager';
export declare class Rest {
    private sessionId;
    private password;
    url: string;
    automata: Manager;
    constructor(automata: Manager, node: Node);
    /** Sets the session ID. */
    setSessionId(sessionId: string): void;
    /** Retrieves all the players that are currently running on the node. */
    getAllPlayers(): Promise<unknown>;
    /** Sends a PATCH request to update player related data. */
    updatePlayer(options: playOptions): Promise<unknown>;
    /** Sends a DELETE request to the server to destroy the player. */
    destroyPlayer(guildId: string): Promise<unknown>;
    get(path: RouteLike): Promise<unknown>;
    patch(endpoint: RouteLike, body: any): Promise<unknown>;
    post(endpoint: RouteLike, body: any): Promise<unknown>;
    delete(endpoint: RouteLike): Promise<unknown>;
}
export interface playOptions {
    guildId: string;
    data: {
        encodedTrack?: string;
        identifier?: string;
        startTime?: number;
        endTime?: number;
        volume?: number;
        position?: number;
        paused?: boolean;
        filters?: object;
        voice?: any;
    };
}
export type RouteLike = `/${string}`;
