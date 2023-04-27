export declare class AutomataTrack {
    track: string;
    identifier: string;
    author: string;
    title: string;
    length: number;
    uri: string;
    isSeekable: boolean;
    isStream: boolean;
    sourceName: string;
    requester: unknown;
    loadType: string;
    constructor(data: TrackData, requester: unknown);
}
export interface TrackDataInfo {
    track?: string;
    identifier?: string;
    author?: string;
    title?: string;
    length?: number;
    uri?: string;
    isSeekable?: boolean;
    isStream?: boolean;
    sourceName?: string;
    requester?: unknown;
}
export interface TrackData {
    loadType?: string;
    track?: string;
    info: TrackDataInfo;
}
