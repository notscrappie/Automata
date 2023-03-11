import { Track } from "./Track"

export default class Queue extends Array {
    /** Gets the size of the queue. */
    get size(): number {
      return this.length;
    }
  
    /** Gets the first song in the queue. */
    first() {
      return this ? this[0] : 0;
    }
  
    /** Adds a new track to the queue. */
    add(track: Track): Queue {
      this.push(track);
      return this;
    }
  
    /** Removes a track from the queue. */
    remove(index: number) {
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
  
  
