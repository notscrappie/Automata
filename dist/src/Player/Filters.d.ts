import { Player } from "./Player";
export declare class Filters {
    player: Player;
    volume: number;
    equalizer: Band[];
    vibrato: vibratoOptions;
    rotation: rotationOptions;
    timescale: timescaleOptions;
    karaoke: karaokeOptions;
    constructor(player: Player);
    /** Sets the equalizer bands and updates the filters. */
    setEqualizer(bands: Band[]): Filters;
    /** Applies the bass boost filter. */
    bassBoost(): Filters;
    /** Applies the nightcore filter. */
    nightcore(): Filters;
    /** Applies the slow motion filter. */
    slowmo(): Filters;
    /** Applies the soft filter. */
    soft(): Filters;
    /** Applies the tv filter. */
    tv(): Filters;
    /** Applies the treble bass filter. */
    trebleBass(): Filters;
    /** Applies the vaporwave filter. */
    vaporwave(): Filters;
    setKaraoke(karaoke?: karaokeOptions): Filters;
    setTimescale(timescale?: timescaleOptions): Filters;
    setVibrato(vibrato?: vibratoOptions): Filters;
    setRotation(rotation?: rotationOptions): Filters;
    clearFilters(): Filters;
    updateFilters(): Filters;
}
interface Band {
    bands: number;
    gain: number;
}
interface timescaleOptions {
    speed?: number;
    pitch?: number;
    rate?: number;
}
interface vibratoOptions {
    frequency: number;
    depth: number;
}
interface rotationOptions {
    rotationHz: number;
}
interface karaokeOptions {
    level?: number;
    monoLevel?: number;
    filterBand?: number;
    filterWidth?: number;
}
export {};
