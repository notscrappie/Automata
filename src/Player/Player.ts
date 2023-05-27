import { Manager, ConnectionOptions } from '../Manager';
import { EventEmitter } from 'events';
import { Filters } from './Filters';
import { Node } from '../Node/Node';
import Queue from '../Guild/Queue';
import { IVoiceServer } from '../Manager';

/** The main hub for everything regarding audio playback. */
export class Player extends EventEmitter {
	/** The data associated with the player. */
	public readonly data: Record<string, unknown>;
	/** The manager responsible for the player. */
	protected automata: Manager;
	/** The node used for audio playback. */
	public node: Node;
	/** The connection options for the player. */
	public options: ConnectionOptions;
	/** The queue of audio tracks. */
	public queue: Queue;
	/** The filters applied to the audio. */
	public filters: Filters;
	/** The ID of the guild the player belongs to. */
	public guildId: string;
	/** The ID of the voice channel the player is connected to. */
	public voiceChannel: string;
	/** The ID of the text channel associated with the player. */
	public textChannel: string;
	/** The current position in the currently playing track. */
	protected position: number;
	/** The current ping to the audio node. */
	public ping: number;
	/** The timestamp of the last player update. */
	protected timestamp: number | null;
	/** Indicates whether the player is muted. */
	public mute: boolean;
	/** Indicates whether the player is deafened. */
	public deaf: boolean;
	/** The volume level of the player. */
	public volume: number;
	/** Indicates if the player is playing or not. */
	public isPlaying: boolean;
	/** Indicates if the player is paused or not. */
	public isPaused: boolean;
	/** Indicates if the player is connected or not. */
	public isConnected: boolean;
	/** The current loop the player is on. */
	public loop: string;
	/** The voice server information. */
	public voice: IVoiceServer | null;

	constructor(automata: Manager, node: Node, options: ConnectionOptions) {
		super();
		this.node = node;
		this.automata = automata;

		this.queue = new Queue();
		this.filters = new Filters(this);

		this.guildId = options.guildId;
		this.voiceChannel = options.voiceChannel;
		this.textChannel = options.textChannel;
		this.deaf = options.deaf ?? false;
		this.mute = options.mute ?? false;

		this.voice = {
			sessionId: null,
			token: null,
			endpoint: null,
		};

		this.volume = 100;
		this.loop = 'NONE';

		this.on('playerUpdate', ({ state: { connected, position, ping, time } }) => {
			this.isConnected = connected;
			this.position = position;
			this.ping = ping;
			this.timestamp = time;
		});

		this.on('event', (data) => this.eventHandler(data));
	}

	/**
	 * Sends a request to the server and plays the requested song.
	 * @returns {void}
	 */
	public play(): void {
		if (!this.queue.length) return;
		this.queue.current = this.queue.shift();

		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: {
				encodedTrack: this.queue.current.track,
			},
		});

		// Don't move this shit above the updatePlayer function or it fucks up the currently playing song. ;-;
		Object.assign(this, { position: 0, isPlaying: true });
	}

	/**
	 * Connects to the user's voice channel.
	 * @param options - The connection options.
	 */
	public connect(options: ConnectionOptions = this): void {
		const { guildId, voiceChannel, deaf, mute } = options;

		this.send({
			guild_id: guildId,
			channel_id: voiceChannel,
			self_deaf: deaf ?? true,
			self_mute: mute ?? false,
		});

		this.isConnected = true;
	}

	/** Stops the player from playing. */
	public stop(): void {
		if (!this.isPlaying) return;

		this.position = 0;
		this.isPlaying = false;

		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: { encodedTrack: null },
		});
	}

	/** Pauses the player. */
	public pause(toggle: boolean): boolean {
		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: { paused: toggle },
		});

		this.isPlaying = !toggle;
		this.isPaused = toggle;

		return true;
	}

	/** Seeks the track. */
	public seekTo(position: number): void {
		const newPosition = Math.min(position + this.position, this.queue.current.length);
		this.node.rest.updatePlayer({ guildId: this.guildId, data: { position: newPosition } });
	}

	/** Sets the volume of the player. */
	public setVolume(volume: number) {
		if (volume < 0 || volume > 100) throw new RangeError('Volume must be between 1-100.');

		this.node.rest.updatePlayer({ guildId: this.guildId, data: { volume } });

		this.volume = volume;
	}

	/** Sets the current loop. */
	public setLoop(mode: Loop): Loop {
		const validModes = new Set(['NONE', 'TRACK', 'QUEUE']);
		if (!validModes.has(mode))
			throw new TypeError(
				'setLoop only accepts NONE, TRACK and QUEUE as arguments.',
			);

		this.loop = mode;
		console.log(mode);
		return mode;
	}

	/** Sets the text channel where event messages (trackStart, trackEnd etc.) will be sent. */
	public setTextChannel(channel: string) {
		this.textChannel = channel;
	}

	/** Sets the voice channel. */
	public setVoiceChannel(
		channel: string,
		options: { mute?: boolean; deaf?: boolean },
	) {
		if (this.isConnected && channel === this.voiceChannel)
			throw new ReferenceError(`Player is already connected to ${channel}`);

		this.voiceChannel = channel;

		this.connect({
			deaf: options.deaf ?? this.deaf,
			guildId: this.guildId,
			voiceChannel: this.voiceChannel,
			textChannel: this.textChannel,
			mute: options.mute ?? this.mute,
		});
	}

	/** Disconnects the player. */
	public disconnect(): void {
		if (!this.voiceChannel) return;
		this.pause(true);
		this.isConnected = false;

		this.send({
			guild_id: this.guildId,
			channel_id: null,
		});

		delete this.voiceChannel;
	}

	/** Destroys the player. */
	public destroy(): void {
		this.disconnect();
		this.node.rest.destroyPlayer(this.guildId);
		this.automata.players.delete(this.guildId);
	}

	/** Restarts the player. */
	public restart(): void {
		if (!this.queue.current?.track) {
			if (this.queue.length) this.play();
			return;
		}

		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: {
				position: this.position,
				encodedTrack: this.queue.current.track,
			},
		});
	}

	/**
	 * Moves the player to another node.
	 * @param name - The name of the new node;
	 * @returns {void}
	 */
	public moveNode(name: string): void {
		const node = this.automata.nodes.get(name);
		if (!node || node.options.name === this.node.options.name) return;
		if (!node.isConnected) throw new Error('The node provided is not available.');

		this.node.rest.destroyPlayer(this.guildId);
		this.automata.players.delete(this.guildId);
		this.node = node;
		this.automata.players.set(this.guildId, this);
		this.restart();
	}

	/** Automatically moves the node. */
	public AutoMoveNode(): void {
		const [node] = this.automata.leastUsedNodes;
		if (!node) throw new Error('There aren\'t any available nodes.');
		if (!this.automata.nodes.has(node.options.name)) return this.destroy();

		return this.moveNode(node.options.name);
	}

	/**
	 * Handles lavalink related events.
	 * @param data The event data.
	 */
	public eventHandler(data: EventInterface): void {
		const eventHandlers: Record<string, () => void> = {
			TrackStartEvent: () => {
				this.isPlaying = true;
				this.automata.emit('trackStart', this, this.queue.current);
			},
			TrackEndEvent: () => {
				this.queue.previous = this.queue.current;

				if (this.loop === 'TRACK') {
					this.queue.unshift(this.queue.previous);
					this.automata.emit('trackEnd', this, this.queue.current);
					return this.play();
				}

				else if (this.queue.current && this.loop === 'QUEUE') {
					this.queue.push(this.queue.previous);
					this.automata.emit('trackEnd', this, this.queue.current, data);
					return this.play();
				}

				if (this.queue.length === 0) {
					this.isPlaying = false;
					return this.automata.emit('queueEnd', this);
				}
				else if (this.queue.length > 0) {
					this.automata.emit('trackEnd', this, this.queue.current);
					return this.play();
				}

				this.isPlaying = false;
				this.automata.emit('queueEnd', this);
			},

			TrackStuckEvent: () => {
				this.automata.emit('trackStuck', this, this.queue.current, data);
				return this.stop();
			},
			TrackExceptionEvent: () => {
				this.automata.emit('trackStuck', this, this.queue.current, data);
				return this.stop();
			},
			WebSocketClosedEvent: () => {
				if ([4015, 4009].includes(data.code)) {
					this.send({
						guild_id: data.guildId,
						channel_id: this.voiceChannel,
						self_mute: this.mute,
						self_deaf: this.deaf,
					});
				}
				this.automata.emit('socketClose', this, this.queue.current, data);
				this.pause(true);
			},
		};

		const eventType = data.type;
		const handleEvents = eventHandlers[eventType];
		if (eventHandlers) handleEvents();
	}

	/** Sends the data to the Lavalink node the old fashioned way. */
	public send(data: object): void {
		return this.automata.send({ op: 4, d: data });
	}
}

interface EventInterface {
	/** The type of the event. */
	type: string;
	/** The OP code of the event. */
	code: number;
	/** The ID of the guild where the event occured. */
	guildId: string;
}

type Loop = 'NONE' | 'TRACK' | 'QUEUE';