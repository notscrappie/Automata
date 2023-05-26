import { Node } from './Node';
export declare class Rest {
    private sessionId;
    private readonly password;
    private readonly url;
    constructor(node: Node);
    /** Sets the session ID. */
    setSessionId(sessionId: string): void;
    /** Retrieves all the players that are currently running on the node. */
    getAllPlayers(): Promise<unknown>;
    /** Sends a PATCH request to update player related data. */
    updatePlayer(options: playOptions): Promise<unknown>;
    /** Sends a DELETE request to the server to destroy the player. */
    destroyPlayer(guildId: string): Promise<unknown>;
    get(path: RouteLike): Promise<unknown>;
    patch(endpoint: RouteLike, body: unknown): Promise<unknown>;
    post(endpoint: RouteLike, body: unknown): Promise<unknown>;
    delete(endpoint: RouteLike): Promise<unknown>;
}
interface playOptions {
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
        voice?: unknown;
    };
}
type RouteLike = `/${string}`;
export {};
