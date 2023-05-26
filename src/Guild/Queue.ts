import { AutomataTrack } from './Track';

export default class Queue extends Array<AutomataTrack> {
	/** Gets the size of the queue. */
	public get size(): number {
		return this.length;
	}

	/** Gets the first song in the queue. */
	public first() {
		return this ? this[0] : 0;
	}

	/**
	 * Adds a new track to the queue.
	 * @param track - The track that will be added to the queue.
	 */
	public add(track: AutomataTrack): Queue {
		this.push(track);
		return this;
	}

	/** The current track. */
	public current: AutomataTrack | null = null;

	/** The previous track. */
	public previous: AutomataTrack | null = null;

	/**
	 * Removes a track from the queue.
	 * @param index - The number of the track that will be removed.
	*/
	public remove(index: number): AutomataTrack {
		return this.splice(index, 1)[0];
	}

	/** Clears the queue. */
	public clear(): AutomataTrack[] {
		return this.splice(0);
	}

	/** Shuffles the queue. */
	public shuffle(): void {
		for (let i = this.length - 1; i > 0; i -= 1) {
			const j = Math.floor(Math.random() * (i + 1));
			[this[i], this[j]] = [this[j], this[i]];
		}
	}
}

