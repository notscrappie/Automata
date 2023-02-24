const { EventEmitter } = require('events');
const Queue = require('./Queue');
const Connection = require('./Voice');

class Player extends EventEmitter {
	constructor(automata, node, options) {
		super();
		this.automata = automata;
		this.queue = new Queue();
		this.node = node;
		this.connection = new Connection(this);
		this.guildId = options.guildId;
		this.voiceChannel = options.voiceChannel;
		this.textChannel = options.textChannel ?? null;
		this.isConnected = false;
		this.isPlaying = false;
		this.isPaused = false;
		this.loop = 'NONE';
		this.position = 0;
		this.ping = 0;
		this.currentTrack = null;
		this.previousTrack = null;

		this.on('event', (data) => this.lavalinkEvent(data));
		this.on('playerUpdate', ({ state: { connected, position, ping } }) => {
			this.isConnected = connected,
			this.position = position,
			this.ping = ping;
		});

		this.automata.emit('playerCreate', this);
	}

	async play(options = {}) {
		if (!this.queue.length) return;
		this.currentTrack = this.queue.shift();

		try {
			if (!this.currentTrack.track) this.currentTrack = await this.currentTrack.resolve(this.poru);
			this.isPlaying = true;
			this.position = 0;

			this.node.send({
				op: 'play',
				guildId: this.guildId,
				track: this.currentTrack.track,
				noReplace: options.noReplace || true,
			});

			return this;
		}
		catch (e) {
			this.poru.emit('trackError', this, this.currentTrack, null);
		}
	}


	stop() {
		this.position = 0;
		this.isPlaying = false;
		this.node.send({
			op: 'stop',
			guildId: this.guildId,
		});
		return this;
	}

	pause(pause = true) {
		if (typeof pause !== 'boolean')
			throw new RangeError('Pause function must be pass with boolean value.');

		this.node.send({
			op: 'pause',
			guildId: this.guildId,
			pause,
		});
		this.isPlaying = !pause;
		this.isPaused = pause;

		return this;
	}

	async seekTo(position) {
		if (Number.isNaN(position)) throw new RangeError('[Poru Error] Position must be a number.');

		this.position = position;
		this.node.send({
			op: 'seek',
			guildId: this.guildId,
			position,
		});
		return this;
	}

	setVolume(volume) {
		// Player.setVolume(Number) Number should be in between 1 and 100
		// currentVolume = Player.filters.volume*100
		if (Number.isNaN(volume))
			throw new RangeError('[Poru Error] Volume level must be a number.');

		if (volume < 1 && volume > 100)
			throw new RangeError('[Poru Error] Volume Number should be in between 1 and 100');

		volume = (volume / 100).toFixed(2);
		this.filters.volume = volume;
		this.filters.updateFilters();

		return this;
	}

	setLoop(mode) {
		if (!mode)
			throw new Error(
				'[Poru Player] You must have to provide loop mode as argument of setLoop',
			);

		if (!['NONE', 'TRACK', 'QUEUE'].includes(mode))
			throw new Error(
				'[Poru Player] setLoop arguments are NONE,TRACK AND QUEUE',
			);

		switch (mode) {
		case 'NONE': {
			this.loop = 'NONE';
			break;
		}
		case 'TRACK': {
			this.loop = 'TRACK';
			break;
		}
		case 'QUEUE': {
			this.loop = 'QUEUE';
			break;
		}
		}

		return this;
	}

	setTextChannel(channel) {
		if (typeof channel !== 'string')
			throw new RangeError('Channel must be a string.');
		this.textChannel = channel;
		return this;
	}
	setVoiceChannel(channel) {
		if (typeof channel !== 'string')
			throw new RangeError('Channel must be a string.');
		if (!this.isConnected) return;
		this.voiceChannel = channel;
		this.poru.sendData({
			op: 4,
			d: {
				guild_id: this.guildId,
				channel_id: this.voiceChannel,
				self_deaf: true,
				self_mute: false,
			},
		});
		this.poru.emit(
			'debug',
			this.guildId,
			`[Poru Player] Voice channel has been changed to ${channel}`,
		);
	}

	connect(options = this) {
		const { guildId, voiceChannel, deaf, mute } = options;
		this.send({
			guild_id: guildId,
			channel_id: voiceChannel,
			self_deaf: deaf || true,
			self_mute: mute || false,
		}, true);

		this.isConnected = true;
		this.poru.emit(
			'debug',
			this.guildId,
			'[Poru Player] Player has been connected',
		);
	}


	reconnect() {
		if (!this.voiceChannel) return;
		this.send({
			guild_id: this.guildId,
			channel_id: this.voiceChannel,
			self_mute: false,
			self_deaf: false,
		});

		return this;
	}

	disconnect() {
		if (this.voiceChannel === null) return null;
		this.pause(true);
		this.isConnected = false;
		this.send({
			guild_id: this.guildId,
			channel_id: null,
			self_mute: false,
			self_deaf: false,
		});
		this.voiceChannel = null;
		return this;
	}

	destroy() {
		this.disconnect();
		this.node.send({
			op: 'destroy',
			guildId: this.guildId,
		});

		this.poru.emit('playerDestroy', this);
		this.poru.emit(
			'debug',
			this.guildId,
			'[Poru Player] destroyed the player',
		);

		this.poru.players.delete(this.guildId);
	}

	restart() {
		this.filters.updateFilters();
		if (this.currentTrack) {
			this.isPlaying = true;
			this.node.send({
				op: 'play',
				startTime: this.position,
				noReplace: true,
				guildId: this.guildId,
				track: this.currentTrack.track,
				pause: this.isPaused,
			});
		}
	}

	send(data) {
		this.poru.sendData({ op: 4, d: data });
	}


	lavalinkEvent(data) {
		const events = {
			TrackStartEvent() {
				this.isPlaying = true;
				this.isPaused = false;
				this.poru.emit('trackStart', this, this.currentTrack, data);
			},

			TrackEndEvent() {
				this.previousTrack = this.currentTrack;

				if (this.currentTrack && this.loop === 'TRACK') {
					this.queue.unshift(this.previousTrack);
					this.poru.emit('trackEnd', this, this.currentTrack, data);
					return this.play();
				}
				else if (this.currentTrack && this.loop === 'QUEUE') {
					this.queue.push(this.previousTrack);
					this.poru.emit('trackEnd', this, this.currentTrack, data);

					return this.play();
				}

				if (this.queue.length === 0) {
					this.isPlaying = false;
					return this.poru.emit('queueEnd', this, this.track, data);
				}
				else if (this.queue.length > 0) {
					this.poru.emit('trackEnd', this, this.currentTrack, data);
					return this.play();
				}
				this.isPlaying = false;
				this.poru.emit('queueEnd', this, this.currentTrack, data);
			},

			TrackStuckEvent() {
				this.poru.emit('trackError', this, this.currentTrack, data);
				this.stop();
			},
			TrackExceptionEvent() {
				this.poru.emit('trackError', this, this.track, data);
				this.stop();
			},
			WebSocketClosedEvent() {
				if ([4015, 4009].includes(data.code)) {
					this.send({
						guild_id: data.guildId,
						channel_id: this.voiceChannel,
						self_mute: this.options.mute || false,
						self_deaf: this.options.deaf || false,
					});
				}
				this.poru.emit('socketClosed', this, data);
			},
			default() {
				throw new Error(`An unknown event: ${data}`);
			},
		};
		return events[data.type] || events.default;
	}
}

module.exports = Player;
