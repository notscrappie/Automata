"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Track = void 0;
class Track {
    track;
    info;
    constructor({ track, info }, requester) {
        this.track = track;
        this.info = {
            ...info,
            image: info.image || `https://i.ytimg.com/vi/${info.identifier}/maxresdefault.jpg` || null,
            requester
        };
    }
    /** Resolves the track. */
    async resolve(automata) {
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const query = `${this.info.author ?? ''} ${this.info.title ?? ''}`.trim();
        const result = await automata.resolve({
            query,
            source: automata.options.defaultPlatform || "dzsearch",
            requester: this.info.requester
        });
        const authorRegex = new RegExp(`^${escapeRegExp(this.info.author)}$`, 'i');
        const sameAuthorOrTitle = (track) => authorRegex.test(track.info.author) ||
            new RegExp(`^${escapeRegExp(this.info.title)}$`, 'i').test(track.info.title);
        const officialAudio = result.tracks.find((track) => sameAuthorOrTitle(track) &&
            new RegExp(/- topic$/i).test(track.info.author));
        const sameDuration = result.tracks.find((track) => track.info.length >= (this.info.length ?? 0) - 2000 &&
            track.info.length <= (this.info.length ?? 0) + 2000 &&
            sameAuthorOrTitle(track));
        const trackToUse = sameDuration ?? officialAudio ?? result.tracks[0];
        if (trackToUse) {
            this.info.identifier = trackToUse?.info?.identifier;
            this.track = trackToUse?.track;
        }
        return this;
    }
}
exports.Track = Track;
//# sourceMappingURL=Track.js.map