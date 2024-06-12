import { Track } from "./Track";
export default class Queue extends Array<Track> {
    /**
     * Returns the number of tracks in the queue.
     * @type {number}
     */
    get size(): number;
    /**
     * Returns the first track in the queue.
     * @returns {Track | undefined} The first track in the queue, or undefined if the queue is empty.
     */
    first(): Track | undefined;
    /**
     * Adds a track to the queue.
     * @param {Track} track - The track to add to the queue.
     * @returns {Queue} The queue with the added track.
     */
    add(track: Track): this;
    /**
    /**
     * Removes a track from the queue by its index.
     * @param {number} index - The index of the track to remove.
     * @returns {Track | undefined} The removed track, or undefined if the index is out of range.
     */
    remove(index: number): Track | undefined;
    /**
      * Clears the entire queue.
      * @returns {Track[]} An array containing all the cleared tracks, or an empty array if the queue was already empty.
      */
    clear(): Track[] | [];
    /**
     * Shuffles the tracks in the queue.
     * @returns {void} This method does not return anything.
     */
    shuffle(): void;
}
