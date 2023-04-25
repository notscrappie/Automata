"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Track = void 0;
class Track {
    track;
    info;
    constructor({ track, info }, requester) {
        this.track = track;
        this.info = { ...info, requester };
    }
    /** Resolves the track. */
    async resolve(automata) {
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
    get identifier() {
        return this.info.identifier;
    }
    get isSeekable() {
        return this.info.isSeekable;
    }
    get author() {
        return this.info.author;
    }
    get length() {
        return this.info.length;
    }
    get isStream() {
        return this.info.isStream;
    }
    get title() {
        return this.info.title;
    }
    get uri() {
        return this.info.uri;
    }
    get sourceName() {
        return this.info.sourceName;
    }
    get requester() {
        return this.info.requester;
    }
}
exports.Track = Track;
//# sourceMappingURL=Track.js.map