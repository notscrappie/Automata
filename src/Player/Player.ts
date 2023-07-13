import { Manager, ConnectionOptions, IVoiceServer } from '../Manager';
import { Filters } from './Filters';
import { Node } from '../Node/Node';
import Queue from '../Guild/Queue';

/** The main hub for everything regarding audio playback. */
export class Player {
	/** The data associated with the player. */
	public readonly data: Record<string, unknown>;
	/** The manager responsible for the player. */
	protected automata: Manager;
	/** The node used for audio playback. */
	public node: Node;
	/** The connection options for the player. */
	public options: ConnectionOptions;
	/** The queue of audio tracks. */
	public queue: Queue = new Queue();
	/** The filters applied to the audio. */
	public filters: Filters;
	/** The ID of the voice channel the player is connected to. */
	public voiceChannel: string;
	/** The ID of the text channel associated with the player. */
	public textChannel: string;
	/** The current position in the currently playing track. */
	public position = 0;
	/** The current ping to the audio node. */
	public ping = 0;
	/** The timestamp of the last player update. */
	public timestamp = null;
	/** The volume level of the player. */
	public volume = 100;
	/** Indicates if the player is playing or not. */
	public isPlaying = false;
	/** Indicates if the player is paused or not. */
	public isPaused = false;
	/** Indicates if the player is connected or not. */
	public isConnected: boolean;
	/** The current loop the player is on. */
	public loop = 'NONE';
	/** The voice server information. */
	public voice?: IVoiceServer = {
		sessionId: null,
		token: null,
		endpoint: null,
	};
	/** The now playing message. */
	public nowPlayingMessage?: NowPlayingMessage;
	public guildId: string;

	constructor(automata: Manager, node: Node, options: ConnectionOptions) {
		this.node = node;
		this.options = options;
		this.automata = automata;
		this.filters = new Filters(this);

		this.guildId = options.guildId;
		this.voiceChannel = options.voiceChannel;
		this.textChannel = options.textChannel;
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
	 * Plays the previous track.
	 */
	public playPrevious(): void {
		// Should return an error.
		if (!this.queue.previous) throw new ReferenceError('There is no previous track. Probably because you either haven\'t queued anything yet or the currently playing song hasn\'t finished playing.');

		if (this.queue.current) this.queue.unshift(this.queue.previous);
		this.play();

		this.queue.previous = null;
	}

	/**
	 * Connects to the user's voice channel.
	 * @param options - The connection options.
	 */
	public connect(): this {
		this.send({
			guild_id: this.guildId,
			channel_id: this.voiceChannel,
			self_deaf: this.options.deaf ?? true,
			self_mute: this.options.mute ?? false,
		});

		this.isConnected = true;
		return this;
	}

	/** Stops the player from playing. */
	public stop(): void {
		if (!this.isPlaying) return;

		this.position = 0;
		this.isPlaying = false;

		this.node.rest.updatePlayer({
			guildId: this.options.guildId,
			data: { encodedTrack: null },
		});
	}

	/** Pauses the player. */
	public pause(toggle: boolean): boolean {
		this.node.rest.updatePlayer({
			guildId: this.options.guildId,
			data: { paused: toggle },
		});

		this.isPlaying = !toggle;
		this.isPaused = toggle;

		return true;
	}

	/** Seeks the track. */
	public seekTo(position: number): void {
		const newPosition = Math.min(position + this.position, this.queue.current.length);
		this.node.rest.updatePlayer({ guildId: this.options.guildId, data: { position: newPosition } });
	}

	/** Sets the volume of the player. */
	public setVolume(volume: number) {
		if (volume < 0 || volume > 100) throw new RangeError('Volume must be between 1-100.');

		this.node.rest.updatePlayer({ guildId: this.options.guildId, data: { volume } });

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
		return mode;
	}

	/** Sets the text channel where event messages (trackStart, trackEnd etc.) will be sent. */
	public setTextChannel(channel: string) {
		this.textChannel = channel;
	}

	/** Sets the now playing message. */
	public setNowPlayingMessage(message: NowPlayingMessage): NowPlayingMessage {
		this.nowPlayingMessage = message;
		return message;
	}

	/** Sets the voice channel. */
	public setVoiceChannel(channel: string) {
		if (this.isConnected && channel === this.voiceChannel)
			throw new ReferenceError(`Player is already connected to ${channel}`);

		this.voiceChannel = channel;

		this.connect();

		return channel;
	}

	/** Disconnects the player. */
	public disconnect(): void {
		if (!this.voiceChannel) return;
		this.pause(true);
		this.isConnected = false;

		this.send({
			guild_id: this.options.guildId,
			channel_id: null,
		});

		delete this.voiceChannel;
	}

	/** Destroys the player. */
	public destroy(): void {
		this.disconnect();
		this.node.rest.destroyPlayer(this.options.guildId);
		this.automata.players.delete(this.options.guildId);
	}

	/** Restarts the player. */
	public restart(): void {
		if (!this.queue.current?.track) {
			if (this.queue.length) this.play();
			return;
		}

		this.node.rest.updatePlayer({
			guildId: this.options.guildId,
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

		this.node.rest.destroyPlayer(this.options.guildId);
		this.automata.players.delete(this.options.guildId);
		this.node = node;
		this.automata.players.set(this.options.guildId, this);
		this.restart();
	}

	/** Automatically moves the node. */
	public AutoMoveNode(): void {
		const [node] = this.automata.leastUsedNodes;
		if (!node) throw new Error('There aren\'t any available nodes.');
		if (!this.automata.nodes.has(node.options.name)) return this.destroy();

		return this.moveNode(node.options.name);
	}

	/** Sends the data to the Lavalink node the old fashioned way. */
	public send(data: object): void {
		return this.automata.send({ op: 4, d: data });
	}
}

interface NowPlayingMessage {
	/** The ID of the channel. */
	channelId: string;
	/** The boolean indicating if the message has been deleted or not. */
	deleted?: boolean;
	/** The delete function. */
	delete: () => Promise<unknown>;
}

type Loop = 'NONE' | 'TRACK' | 'QUEUE';