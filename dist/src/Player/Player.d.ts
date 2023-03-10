/// <reference types="node" />
import { Manager, ResolveOptions, ConnectionOptions } from "../Manager";
import { Node } from "../Node/Node";
import { Track } from "../guild/Track";
import { Connection } from "./Connection";
import Queue from "../guild/Queue";
import { EventEmitter } from "events";
import { Filters } from "./Filters";
import { Response } from "../guild/Response";
export declare class Player extends EventEmitter {
    readonly data: Record<string, unknown>;
    automata: Manager;
    node: Node;
    connection: Connection;
    queue: Queue;
    filters: Filters;
    guildId: string;
    voiceChannel: string;
    textChannel: string;
    currentTrack: Track;
    previousTrack: Track;
    isPlaying: boolean;
    isPaused: boolean;
    isConnected: boolean;
    loop: Loop;
    position: number;
    ping: number;
    timestamp: number;
    mute: boolean;
    deaf: boolean;
    volume: number;
    constructor(automata: Manager, node: Node, options: ConnectionOptions);
    /** Sends a request to the server and plays the requested song. */
    play(): Promise<void>;
    /** Connects to the user's voice channel. */
    connect(options?: ConnectionOptions): void;
    /** Stops the player from playing. */
    stop(): this;
    /** Pauses the player. */
    pause(toggle: boolean): this;
    /** Seeks the track. */
    seekTo(position: number): void;
    /** Sets the volume of the player. */
    setVolume(volume: number): this;
    /** Sets the current loop. */
    setLoop(mode: Loop): this;
    /** Sets the text channel where event messages (trackStart, trackEnd etc.) will be sent. */
    setTextChannel(channel: string): this;
    /** Sets the voice channel. */
    setVoiceChannel(channel: string, options: {
        mute?: boolean;
        deaf?: boolean;
    }): this;
    set(key: string, value: unknown): unknown;
    get<K>(key: string): K;
    /** Disconnects the player. */
    disconnect(): this;
    /** Destroys the player. */
    destroy(): void;
    /** Restarts the player. */
    restart(): void;
    /** Moves the player to another node. */
    moveNode(name: string): void;
    /** Automatically moves the node. */
    AutoMoveNode(): Promise<void>;
    /** Handles lavalink related events. */
    eventHandler(data: any): boolean | Promise<void>;
    /** Resolves the provided query. */
    resolve({ query, source, requester }: ResolveOptions): Promise<Response>;
    /** Sends the data to the Lavalink node the old fashioned way. */
    send(data: object): void;
}
export type Loop = "NONE" | "TRACK" | "QUEUE";
