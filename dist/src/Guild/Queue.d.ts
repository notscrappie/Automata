import { AutomataTrack } from './Track';
export default class Queue extends Array<AutomataTrack> {
    /**
     * Gets the size of the queue.
    */
    get size(): number;
    /**
     * Gets the first song in the queue.
     */
    first(): AutomataTrack | 0;
    /** Adds a new track to the queue. */
    add(track: AutomataTrack): Queue;
    /** The current track. */
    current: AutomataTrack | null;
    /** The previous track. */
    previous: AutomataTrack | null;
    /** Removes a track from the queue. */
    remove(index: number): AutomataTrack;
    /** Clears the queue. */
    clear(): AutomataTrack[];
    /** Shuffles the queue. */
    shuffle(): void;
}
