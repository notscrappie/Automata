import { Track } from './Track';
export declare class Response {
    tracks: Track[];
    loadType: LoadType;
    playlistInfo: PlaylistInfo;
    constructor(data: LavalinkResponse, requester: unknown);
}
interface LavalinkResponse {
    loadType?: LoadType;
    playlistInfo?: PlaylistInfo;
    tracks?: Track[];
}
interface PlaylistInfo {
    name?: string;
    selectedTrack?: number;
}
type LoadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';
export {};
