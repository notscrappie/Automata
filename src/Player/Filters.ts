import { Band, bassBoostEqualizer, softEqualizer, tvEqualizer, trebleBassEqualizer, vaporwaveEqualizer } from '../Utils/EQPresets';
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
	public setEqualizer(bands?: Band[]): this {
		this.equalizer = bands;
		this.updateFilters();
		return this;
	}

	/**
	 * Applies the 8D filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public eightD(): this {
		return this.setRotation({ rotationHz: 0.2 });
	}

	/**
	 * Applies the bass boost filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public bassBoost(): this {
		return this.setEqualizer(bassBoostEqualizer);
	}

	/**
	 * Applies the nightcore filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public nightcore(): this {
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
	public slowmo(): this {
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
	public soft(): this {
		return this.setEqualizer(softEqualizer);
	}

	/**
	 * Applies the TV filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public tv(): this {
		return this.setEqualizer(tvEqualizer);
	}

	/**
	 * Applies the treble bass filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public trebleBass(): this {
		return this.setEqualizer(trebleBassEqualizer);
	}

	/**
	 * Applies the vaporwave filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	*/
	public vaporwave(): this {
		this.setEqualizer(vaporwaveEqualizer);
		return this.setTimescale({ pitch: 0.55 });
	}

	/**
	 * Applies the karaoke options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setKaraoke(karaoke?: karaokeOptions): this {
		this.karaoke = karaoke || null;
		this.updateFilters();

		return this;
	}

	/**
	 * Applies the timescale options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setTimescale(timescale?: timescaleOptions): this {
		this.timescale = timescale || null;
		this.updateFilters();

		return this;
	}

	/**
	 * Applies the vibrato options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setVibrato(vibrato?: vibratoOptions): this {
		this.vibrato = vibrato || null;
		this.updateFilters();
		return this;
	}

	/**
	 * Applies the rotation options specified by the filter.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public setRotation(rotation?: rotationOptions): this {
		this.rotation = rotation || null;
		this.updateFilters();

		return this;
	}

	/**
	 * Clears the filters.
	 * @returns The updated Filters instance applied to the currently playing track.
	 */
	public clearFilters(): this {
		this.player.filters = new Filters(this.player);
		this.updateFilters();
		return this;
	}

	/**
     * Updates the filters.
     * @returns The updated Filters instance applied to the currently playing track.
     */
	public updateFilters(): this {
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