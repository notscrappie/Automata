export class AutomataTrack {
	/** The track identifier. */
	public track: string;
	/** The identifier of the track. */
	public identifier: string;
	/** The author of the track. */
	public author: string;
	/** The title of the track. */
	public title: string;
	/** The length of the track in milliseconds. */
	public length: number;
	/** The URI of the track. */
	public uri: string;
	/** Indicates if the track is seekable. */
	public isSeekable: boolean;
	/** Indicates if the track is a stream. */
	public isStream: boolean;
	/** The name of the source providing the track. */
	public sourceName: string;
	/** The requester of the track. */
	public requester: unknown;
	/** The load type of the track. */
	public loadType: string;

	/**
   	 * Creates a new AutomataTrack instance.
   	 * @param data The track data.
     * @param requester The requester of the track.
    */
	constructor(data: TrackData, requester: unknown) {
		const {
			track,
			info: {
				identifier,
				author,
				title,
				length,
				uri,
				isSeekable,
				isStream,
				sourceName,
			},
		} = data;

		this.track = track;
		this.identifier = identifier;
		this.author = author;
		this.title = title;
		this.length = length;
		this.uri = uri;
		this.isSeekable = isSeekable;
		this.isStream = isStream;
		this.sourceName = sourceName;
		this.requester = requester;
	}
}

/** Represents the information of a track. */
interface TrackDataInfo {
	/** The track information. */
	track?: string;
	/** The identifier of the track. */
	identifier?: string;
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
	/** The load type of the track. */
	loadType?: string;
	/** The track information. */
	track?: string;
	/** The detailed information of the track. */
	info: TrackDataInfo;
}