"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filters = void 0;
class Filters {
    player;
    volume;
    equalizer;
    vibrato;
    rotation;
    timescale;
    karaoke;
    constructor(player) {
        this.player = player;
        this.volume = 1.0;
        this.equalizer = [];
        this.timescale = null;
        this.vibrato = null;
        this.rotation = null;
        this.karaoke = null;
    }
    /** Sets the equalizer bands and updates the filters. */
    setEqualizer(bands) {
        this.equalizer = bands;
        this.updateFilters();
        return this;
    }
    /** Applies the bass boost filter. */
    bassBoost() {
        const equalizer = [
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
        return this.setEqualizer(equalizer);
    }
    /** Applies the nightcore filter. */
    nightcore() {
        const timescale = {
            speed: 1.1,
            pitch: 1.125,
            rate: 1.05,
        };
        return this.setTimescale(timescale);
    }
    /** Applies the slow motion filter. */
    slowmo() {
        const timescale = {
            speed: 0.5,
            pitch: 1.0,
            rate: 0.8,
        };
        return this.setTimescale(timescale);
    }
    /** Applies the soft filter. */
    soft() {
        const equalizer = [
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
        return this.setEqualizer(equalizer);
    }
    /** Applies the tv filter. */
    tv() {
        const equalizer = [
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
        return this.setEqualizer(equalizer);
    }
    /** Applies the treble bass filter. */
    trebleBass() {
        const equalizer = [
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
        return this.setEqualizer(equalizer);
    }
    /** Applies the vaporwave filter. */
    vaporwave() {
        const equalizer = [
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
        this.setEqualizer(equalizer);
        return this.setTimescale({ pitch: 0.55 });
    }
    setKaraoke(karaoke) {
        this.karaoke = karaoke || null;
        this.updateFilters();
        return this;
    }
    setTimescale(timescale) {
        this.timescale = timescale || null;
        this.updateFilters();
        return this;
    }
    setVibrato(vibrato) {
        this.vibrato = vibrato || null;
        this.updateFilters();
        return this;
    }
    setRotation(rotation) {
        this.rotation = rotation || null;
        this.updateFilters();
        return this;
    }
    clearFilters() {
        this.player.filters = new Filters(this.player);
        this.updateFilters();
        return this;
    }
    updateFilters() {
        const { equalizer, karaoke, timescale, vibrato, rotation, volume } = this;
        this.player.node.rest.updatePlayer({
            guildId: this.player.guildId,
            data: {
                filters: { equalizer, karaoke, timescale, vibrato, rotation, volume },
            },
        });
        return this;
    }
}
exports.Filters = Filters;
//# sourceMappingURL=Filters.js.map