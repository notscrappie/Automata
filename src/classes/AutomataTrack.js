const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class AutomataTrack {
	constructor(data) {
		this.track = data.track;
		this.info = {
			identifier: data.info.identifier ?? null,
			isSeekable: data.info.isSeekable,
			author: data.info.author,
			length: data.info.length,
			isStream: data.info.isStream,
			sourceName: data.info.sourceName,
			title: data.info.title,
			uri: data.info.uri,
			image: `https://i.ytimg.com/vi/${data.info.identifier}/maxresdefault.jpg` || null,
		};
	}

	/**
   	* Resolves the track.
   	*/
	async resolve(manager) {
		const { author, title } = this.info;
		const query = [author, title].filter((x) => Boolean(x)).join(' - ');
		const result = await manager.resolve(query, manager.options.defaultPlatform || 'dzsearch');

		if (!result || !result.tracks.length) return;

		const officialAudio = result.tracks.find((track) => {
			const authorRegex = author ? new RegExp(`^${escapeRegExp(author)}$`, 'i') : null;
			return (
				(authorRegex && authorRegex.test(track.info.author)) || (title && new RegExp(`^${escapeRegExp(title)}$`, 'i').test(track.info.title))
			);
		});

		if (officialAudio) {
			this.info.identifier = officialAudio.info.identifier;
			this.image = `https://i.ytimg.com/vi/${this.info.identifier}/maxresdefault.jpg`;
			this.track = officialAudio.track;
			this.info.length = officialAudio.info.length;
			return this;
		}

		const sameDuration = result.tracks.find((track) => (
			track.info.length >= (this.info.length || 0) - 2000 &&
			track.info.length <= (this.info.length || 0) + 2000
		));

		if (sameDuration) {
			this.info.identifier = sameDuration.info.identifier;
			this.image = `https://i.ytimg.com/vi/${this.info.identifier}/maxresdefault.jpg`;
			this.track = sameDuration.track;
			return this;
		}

		this.info.identifier = result.tracks[0].info.identifier;
		this.image = `https://i.ytimg.com/vi/${this.info.identifier}/maxresdefault.jpg`;
		this.track = result.tracks[0].track;
		return this;
	}
}

module.exports = AutomataTrack;
