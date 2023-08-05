/** Represents the information of a track. */
export interface TrackDataInfo {
	/** The Base64 encoded track. */
	track: string;
	/** The identifier of the track. */
	identifier?: string;
	/** The URL of the song's artwork. */
	artworkUrl?: string;
	/** The ISRC of the track. */
	irsc?: string;
	/** The author of the track. */
	author?: string;
	/** The title of the track. */
	title?: string;
	/** The length of the track in milliseconds. */
	length?: number;
	/** The URI of the track. */
	uri?: string;
	/** Indicates if the track is seekable. */
	isSeekable?: boolean;
	/** Indicates if the track is a stream. */
	isStream?: boolean;
	/** The name of the source providing the track. */
	sourceName?: string;
	/** The requester of the track. */
	requester?: unknown;
}

/** Represents the data of a track. */
export interface TrackData {
	encoded?: string;
	info?: TrackDataInfo
}