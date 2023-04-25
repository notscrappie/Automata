"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Queue extends Array {
    /** Gets the size of the queue. */
    get size() {
        return this.length;
    }
    /** Gets the first song in the queue. */
    first() {
        return this ? this[0] : 0;
    }
    /** Adds a new track to the queue. */
    add(track) {
        this.push(track);
        return this;
    }
    /** The current track. */
    current = null;
    /** The previous track. */
    previous = null;
    /** Removes a track from the queue. */
    remove(index) {
        return this.splice(index, 1)[0];
    }
    /** Clears the queue. */
    clear() {
        return this.splice(0);
    }
    /** Shuffles the queue. */
    shuffle() {
        for (let i = this.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }
}
exports.default = Queue;
//# sourceMappingURL=Queue.js.map