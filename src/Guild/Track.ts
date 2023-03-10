import { Manager } from "../Manager";

export class Track {
    public track: string;
    public info: TrackInfo;

  constructor({ track, info }: TrackData, requester?: any) {
    this.track = track;
    this.info = {
      ...info,
      image: info.image || `https://i.ytimg.com/vi/${info.identifier}/maxresdefault.jpg` || null,
      requester
    };
  }

  /** Resolves the track. */
  public async resolve(automata: Manager) {
    const escapeRegExp = (str: string) => 
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = `${this.info.author ?? ''} ${this.info.title ?? ''}`.trim();
    const result = await automata.resolve({ 
      query, 
      source: automata.options.defaultPlatform || "dzsearch", 
      requester: this.info.requester 
    });
    const authorRegex = new RegExp(`^${escapeRegExp(this.info.author)}$`, 'i');

    const sameAuthorOrTitle = (track: TrackData) =>
      authorRegex.test(track.info.author) ||
      new RegExp(`^${escapeRegExp(this.info.title)}$`, 'i').test(
				track.info.title,
      );

    const officialAudio = result.tracks.find(
        (track: TrackData) =>
          sameAuthorOrTitle(track) &&
          new RegExp(/- topic$/i).test(track.info.author),
    );

    const sameDuration = result.tracks.find(
			(track: TrackData) =>
				track.info.length >= (this.info.length ?? 0) - 2000 &&
				track.info.length <= (this.info.length ?? 0) + 2000 &&
				sameAuthorOrTitle(track),
		);

    const trackToUse = sameDuration ?? officialAudio ?? result.tracks[0];

    if (trackToUse) {
			this.info.identifier = trackToUse?.info?.identifier;
			this.track = trackToUse?.track;
		}

		return this;
  }
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
  isStream : boolean;
  title: string;
  uri: string;
  sourceName: string;
  image?: string
  requester?: object
}