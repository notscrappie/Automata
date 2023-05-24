import { AutomataTrack } from "./Track";

export default class Queue extends Array<AutomataTrack> {
  /** Gets the size of the queue. */
  public get size(): number {
    return this.length;
  }

  /** Gets the first song in the queue. */
  public first() {
    return this ? this[0] : 0;
  }

  /** Adds a new track to the queue. */
  public add(track: AutomataTrack): Queue {
    this.push(track);
    return this;
  }

  /** The current track. */
  public current: AutomataTrack | null = null;

  /** The previous track. */
  public previous: AutomataTrack | null = null;

  /** Removes a track from the queue. */
  public remove(index: number) {
    return this.splice(index, 1)[0];
  }

  /** Clears the queue. */
  public clear() {
    return this.splice(0);
  }

  /** Shuffles the queue. */
  public shuffle() {
    for (let i = this.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this[i], this[j]] = [this[j], this[i]];
    }
  }
}
