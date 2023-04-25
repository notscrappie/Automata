import { Track } from './Track';

export class Response {
	public tracks: Track[];
	public loadType: LoadType;
	public playlistInfo: PlaylistInfo;

	constructor(data: LavalinkResponse, requester: unknown) {
		this.tracks = data?.tracks?.map((track) => new Track(track, requester));
		this.loadType = data?.loadType;
		this.playlistInfo = data?.playlistInfo;
	}
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

type LoadType =
  | 'TRACK_LOADED'
  | 'PLAYLIST_LOADED'
  | 'SEARCH_RESULT'
  | 'NO_MATCHES'
  | 'LOAD_FAILED'