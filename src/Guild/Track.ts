export class AutomataTrack {
	public track: string;
	public identifier: string;
	public author: string;
	public title: string;
	public length: number;
	public uri: string;
	public isSeekable: boolean;
	public isStream: boolean;
	public sourceName: string;
	public requester: unknown;
	public loadType: string;

	constructor(data: TrackData, requester: unknown) {
		this.track = data.track;
		this.identifier = data.info.identifier;
		this.author = data.info.author;
		this.title = data.info.title;
		this.length = data.info.length;
		this.uri = data.info.uri;
		this.isSeekable = data.info.isSeekable;
		this.isStream = data.info.isStream;
		this.sourceName = data.info.sourceName;
		this.requester = requester;
	}
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