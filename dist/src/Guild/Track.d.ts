import { Manager } from '../Manager';
export declare class Track {
    track: string;
    info: TrackInfo;
    constructor({ track, info }: TrackData, requester?: unknown);
    /** Resolves the track. */
    resolve(automata: Manager): Promise<this>;
    get identifier(): string;
    get isSeekable(): boolean;
    get author(): string;
    get length(): number;
    get isStream(): boolean;
    get title(): string;
    get uri(): string;
    get sourceName(): string;
    get requester(): unknown;
}
export interface TrackData {
    track?: string;
    info?: TrackInfo;
}
export interface TrackInfo {
    identifier?: string;
    isSeekable?: boolean;
    author?: string;
    length?: number;
    isStream?: boolean;
    title?: string;
    uri?: string;
    sourceName?: string;
    requester?: unknown;
}
