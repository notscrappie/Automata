"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomataTrack = void 0;
class AutomataTrack {
    track;
    identifier;
    author;
    title;
    length;
    uri;
    isSeekable;
    isStream;
    sourceName;
    requester;
    loadType;
    constructor(data, requester) {
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
exports.AutomataTrack = AutomataTrack;
//# sourceMappingURL=Track.js.map