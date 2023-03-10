import { Manager } from "../Manager";
export declare class Track {
    track: string;
    info: TrackInfo;
    constructor({ track, info }: TrackData, requester?: any);
    /** Resolves the track. */
    resolve(automata: Manager): Promise<this>;
}
export interface TrackData {
    track: string;
    info: TrackInfo;
}
export interface TrackInfo {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    title: string;
    uri: string;
    sourceName: string;
    image?: string;
    requester?: object;
}
