/** Options for adjusting the timescale of audio. */
export interface TimescaleOptions {
	/** The speed factor for the timescale. */
	speed?: number;
	/** The pitch factor for the timescale. */
	pitch?: number;
	/** The rate factor for the timescale. */
	rate?: number;
}

/** Options for applying vibrato effect to audio. */
export interface VibratoOptions {
	/** The frequency of the vibrato effect. */
	frequency: number;
	/** * The depth of the vibrato effect.*/
	depth: number;
}

/** Options for applying rotation effect to audio. */
export interface RotationOptions {
	/** The rotation speed in Hertz (Hz). */
	rotationHz: number;
}

/** Options for applying karaoke effect to audio. */
export interface KaraokeOptions {
	/** The level of karaoke effect. */
	level?: number;
	/** The mono level of karaoke effect. */
	monoLevel?: number;
	/** The filter band of karaoke effect. */
	filterBand?: number;
	/** The filter width of karaoke effect. */
	filterWidth?: number;
}