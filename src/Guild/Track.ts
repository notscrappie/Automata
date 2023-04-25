import { Manager } from '../Manager';

export class Track {
	public track: string;
	public info: TrackInfo;

	constructor({ track, info }: TrackData, requester?: unknown) {
		this.track = track;
		this.info = { ...info, requester };
	}

	/** Resolves the track. */
	public async resolve(automata: Manager) {
		const query = `${this.info.author ?? ''} ${this.info.title ?? ''}`.trim();
		const result = await automata.resolve({
			query,
			source: automata.options.defaultPlatform || 'dzsearch',
			requester: this.info.requester,
		});

		const trackToUse = result.tracks[0];

		if (trackToUse) {
			this.info.identifier = trackToUse?.info?.identifier;
			this.track = trackToUse?.track;
		}

		return this;
	}

	public get identifier(): string {
		return this.info.identifier;
	}

	public get isSeekable(): boolean {
		return this.info.isSeekable;
	}

	public get author(): string {
		return this.info.author;
	}

	public get length(): number {
		return this.info.length;
	}

	public get isStream(): boolean {
		return this.info.isStream;
	}
	public get title(): string {
		return this.info.title;
	}
	public get uri(): string {
		return this.info.uri;
	}

	public get sourceName(): string {
		return this.info.sourceName;
	}

	public get requester(): unknown {
		return this.info.requester;
	}
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