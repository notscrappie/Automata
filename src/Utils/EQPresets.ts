export const bassBoostEqualizer: Band[] = [
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

export const softEqualizer: Band[] = [
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

export const tvEqualizer: Band[] = [
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

export const trebleBassEqualizer: Band[] = [
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

export const vaporwaveEqualizer: Band[] = [
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

/** Represents an equalizer band. */
export interface Band {
	/** The index of the equalizer band. */
	bands: number;
	/** The gain value of the equalizer band. */
	gain: number;
}