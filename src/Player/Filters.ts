import { Player } from './Player';

export class Filters {
	public player: Player;
	public volume = 1.0;
	public equalizer: Band[] = [];
	public vibrato: vibratoOptions = null;
	public rotation: rotationOptions = null;
	public timescale: timescaleOptions = null;
	public karaoke: karaokeOptions = null;

	constructor(player: Player) {
		this.player = player;
	}

	/**
	 * Sets the equalizer bands and updates the filters.
	 * @param bands - The equalizer bands.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setEqualizer(bands?: Band[]): Filters {
		this.equalizer = bands;
		this.updateFilters();
		return this;
	}

	/**
	 * Applies the 8D filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public eightD(): Filters {
		return this.setRotation({ rotationHz: 0.2 });
	}

	/**
	 * Applies the bass boost filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public bassBoost(): Filters {
		return this.setEqualizer(bassBoostEqualizer);
	}

	/**
	 * Applies the nightcore filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public nightcore(): Filters {
		return this.setTimescale({
			speed: 1.1,
			pitch: 1.125,
			rate: 1.05,
		});
	}

	/**
	 * Applies the slow motion filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public slowmo(): Filters {
		return this.setTimescale({
			speed: 0.5,
			pitch: 1.0,
			rate: 0.8,
		});
	}

	/**
	 * Applies the soft filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public soft(): Filters {
		return this.setEqualizer(softEqualizer);
	}

	/**
	 * Applies the TV filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public tv(): Filters {
		return this.setEqualizer(tvEqualizer);
	}

	/**
	 * Applies the treble bass filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public trebleBass(): Filters {
		return this.setEqualizer(trebleBassEqualizer);
	}

	/**
	 * Applies the vaporwave filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public vaporwave(): Filters {
		this.setEqualizer(vaporwaveEqualizer);
		return this.setTimescale({ pitch: 0.55 });
	}

	/**
	 * Applies the karaoke options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setKaraoke(karaoke?: karaokeOptions): Filters {
		this.karaoke = karaoke || null;
		this.updateFilters();

		return this;
	}

	/**
	 * Applies the timescale options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setTimescale(timescale?: timescaleOptions): Filters {
		this.timescale = timescale || null;
		this.updateFilters();

		return this;
	}

	/**
	 * Applies the vibrato options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setVibrato(vibrato?: vibratoOptions): Filters {
		this.vibrato = vibrato || null;
		this.updateFilters();
		return this;
	}

	/**
	 * Applies the rotation options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setRotation(rotation?: rotationOptions): Filters {
		this.rotation = rotation || null;
		this.updateFilters();

		return this;
	}

	/**
	 * Clears the filters.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public clearFilters(): Filters {
		this.player.filters = new Filters(this.player);
		this.updateFilters();
		return this;
	}

	/**
     * Updates the filters.
     * @returns The updated Filters instance applied to the currently playing track.
     */
	public updateFilters(): Filters {
		const { equalizer, karaoke, timescale, vibrato, rotation, volume } = this;

		this.player.node.rest.updatePlayer({
			guildId: this.player.options.guildId,
			data: {
				filters: {
					volume, equalizer, karaoke, timescale, vibrato, rotation,
				},
			},
		});

		return this;
	}
}

/** Represents an equalizer band. */
export interface Band {
	/** The index of the equalizer band. */
	bands: number;
	/** The gain value of the equalizer band. */
	gain: number;
}

/** Options for adjusting the timescale of audio. */
interface timescaleOptions {
	/** The speed factor for the timescale. */
	speed?: number;
	/** The pitch factor for the timescale. */
	pitch?: number;
	/** The rate factor for the timescale. */
	rate?: number;
}

/** Options for applying vibrato effect to audio. */
interface vibratoOptions {
	/** The frequency of the vibrato effect. */
	frequency: number;
	/** * The depth of the vibrato effect.*/
	depth: number;
}

/** Options for applying rotation effect to audio. */
interface rotationOptions {
	/** The rotation speed in Hertz (Hz). */
	rotationHz: number;
}

/** Options for applying karaoke effect to audio. */
interface karaokeOptions {
	/** The level of karaoke effect. */
	level?: number;
	/** The mono level of karaoke effect. */
	monoLevel?: number;
	/** The filter band of karaoke effect. */
	filterBand?: number;
	/** The filter width of karaoke effect. */
	filterWidth?: number;
}

const bassBoostEqualizer: Band[] = [
	{ bands: 0, gain: 0.65 },
	{ bands: 1, gain: 0.45 },
	{ bands: 2, gain: -0.45 },
	{ bands: 3, gain: -0.65 },
	{ bands: 4, gain: -0.35 },
	{ bands: 5, gain: 0.45 },
	{ bands: 6, gain: 0.55 },
	{ bands: 7, gain: 0.6 },
	{ bands: 8, gain: 0.6 },
	{ bands: 9, gain: 0.6 },
	{ bands: 10, gain: 0 },
	{ bands: 11, gain: 0 },
	{ bands: 12, gain: 0 },
	{ bands: 13, gain: 0 },
];

const softEqualizer: Band[] = [
	{ bands: 0, gain: 0 },
	{ bands: 1, gain: 0 },
	{ bands: 2, gain: 0 },
	{ bands: 3, gain: 0 },
	{ bands: 4, gain: 0 },
	{ bands: 5, gain: 0 },
	{ bands: 6, gain: 0 },
	{ bands: 7, gain: 0 },
	{ bands: 8, gain: -0.25 },
	{ bands: 9, gain: -0.25 },
	{ bands: 10, gain: -0.25 },
	{ bands: 11, gain: -0.25 },
	{ bands: 12, gain: -0.25 },
	{ bands: 13, gain: -0.25 },
];

const tvEqualizer: Band[] = [
	{ bands: 0, gain: 0 },
	{ bands: 1, gain: 0 },
	{ bands: 2, gain: 0 },
	{ bands: 3, gain: 0 },
	{ bands: 4, gain: 0 },
	{ bands: 5, gain: 0 },
	{ bands: 6, gain: 0 },
	{ bands: 7, gain: 0.65 },
	{ bands: 8, gain: 0.65 },
	{ bands: 9, gain: 0.65 },
	{ bands: 10, gain: 0.65 },
	{ bands: 11, gain: 0.65 },
	{ bands: 12, gain: 0.65 },
	{ bands: 13, gain: 0.65 },
];

const trebleBassEqualizer: Band[] = [
	{ bands: 0, gain: 0.6 },
	{ bands: 1, gain: 0.67 },
	{ bands: 2, gain: 0.67 },
	{ bands: 3, gain: 0 },
	{ bands: 4, gain: -0.5 },
	{ bands: 5, gain: 0.15 },
	{ bands: 6, gain: -0.45 },
	{ bands: 7, gain: 0.23 },
	{ bands: 8, gain: 0.35 },
	{ bands: 9, gain: 0.45 },
	{ bands: 10, gain: 0.55 },
	{ bands: 11, gain: 0.6 },
	{ bands: 12, gain: 0.55 },
	{ bands: 13, gain: 0 },
];

const vaporwaveEqualizer: Band[] = [
	{ bands: 0, gain: 0 },
	{ bands: 1, gain: 0 },
	{ bands: 2, gain: 0 },
	{ bands: 3, gain: 0 },
	{ bands: 4, gain: 0 },
	{ bands: 5, gain: 0 },
	{ bands: 6, gain: 0 },
	{ bands: 7, gain: 0 },
	{ bands: 8, gain: 0.15 },
	{ bands: 9, gain: 0.15 },
	{ bands: 10, gain: 0.15 },
	{ bands: 11, gain: 0.15 },
	{ bands: 12, gain: 0.15 },
	{ bands: 13, gain: 0.15 },
];