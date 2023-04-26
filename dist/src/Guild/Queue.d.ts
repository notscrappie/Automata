import { Track } from './Track';
export default class Queue extends Array<Track> {
    /** Gets the size of the queue. */
    get size(): number;
    /** Gets the first song in the queue. */
    first(): Track | 0;
    /** Adds a new track to the queue. */
    add(track: Track): Queue;
    /** The current track. */
    current: Track | null;
    /** The previous track. */
    previous: Track | null;
    /** Removes a track from the queue. */
    remove(index: number): Track;
    /** Clears the queue. */
    clear(): Track[];
    /** Shuffles the queue. */
    shuffle(): void;
}
