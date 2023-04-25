import { Manager, ResolveOptions, ConnectionOptions } from '../Manager';
import { Node } from '../Node/Node';
import { Track } from '../Guild/Track';
import { Connection } from './Connection';
import Queue from '../Guild/Queue';
import { EventEmitter } from 'events';
import { Filters } from './Filters';
import { RouteLike } from '../Node/Rest';

export class Player extends EventEmitter {
	public readonly data: Record<string, unknown>;
	public automata: Manager;
	public node: Node;
	public connection: Connection;
	public queue: Queue;
	public filters: Filters;
	public guildId: string;
	public voiceChannel: string;
	public textChannel: string;
	public isPlaying: boolean;
	public isPaused: boolean;
	public isConnected: boolean;
	public loop: Loop;
	public position: number;
	public ping: number;
	public timestamp: number;
	public mute: boolean;
	public deaf: boolean;
	public volume: number;

	constructor(automata: Manager, node: Node, options: ConnectionOptions) {
		super();
		this.automata = automata;
		this.node = node;
		this.queue = new Queue();
		this.connection = new Connection(this);
		this.guildId = options.guildId;
		this.filters = new Filters(this);
		this.voiceChannel = options.voiceChannel;
		this.textChannel = options.textChannel;
		this.deaf = options.deaf ?? false;
		this.mute = options.mute ?? false;
		this.volume = 100;
		this.isPlaying = false;
		this.isPaused = false;
		this.position = 0;
		this.ping = 0;
		this.timestamp = null;
		this.isConnected = false;
		this.loop = 'NONE';
		this.data = {};

		this.on('playerUpdate', ({ state: { connected, position, ping, time } }) => {
			this.isConnected = connected;
			this.position = position;
			this.ping = ping;
			this.timestamp = time;
		});

		this.on('event', ({ type }) => this.eventHandler(type));
	}

	/** Sends a request to the server and plays the requested song. */
	public async play() {
		if (this.queue.length === 0) return;
		const { track } = this.queue.current = this.queue.shift();

		if (!track) await this.queue.current.resolve(this.automata);

		Object.assign(this, { position: 0, isPlaying: true });

		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: {
				encodedTrack: this.queue.current.track,
			},
		});
	}

	/** Connects to the user's voice channel. */
	public connect(options: ConnectionOptions = this) {
		this.send({
			guild_id: options.guildId,
			channel_id: options.voiceChannel,
			self_deaf: options.deaf ?? true,
			self_mute: options.mute ?? false,
		});

		this.isConnected = true;
	}

	/** Stops the player from playing. */
	public stop() {
		if (!this.isPlaying) return;

		this.position = 0;
		this.isPlaying = false;

		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: { encodedTrack: null },
		});

		return this;
	}

	/** Pauses the player. */
	public pause(toggle: boolean) {
		this.node.rest.updatePlayer({
			guildId: this.guildId,
			data: { paused: toggle },
		});

		this.isPlaying = !toggle;
		this.isPaused = toggle;

		return this;
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
		return this;
	}

	/** Sets the current loop. */
	public setLoop(mode: Loop) {
		const validModes = new Set(['NONE', 'TRACK', 'QUEUE']);
		if (!validModes.has(mode))
			throw new TypeError(
				'setLoop only accepts NONE, TRACK and QUEUE as arguments.',
			);

		this.loop = mode;
		return this;
	}

	/** Sets the text channel where event messages (trackStart, trackEnd etc.) will be sent. */
	public setTextChannel(channel: string) {
		this.textChannel = channel;
		return this;
	}

	/** Sets the voice channel. */
	public setVoiceChannel(
		channel: string,
		options: { mute?: boolean; deaf?: boolean },
	) {
		if (this.isConnected && channel == this.voiceChannel)
			throw new ReferenceError(`Player is already connected to ${channel}`);

		this.voiceChannel = channel;

		this.connect({
			deaf: options.deaf ?? this.deaf,
			guildId: this.guildId,
			voiceChannel: this.voiceChannel,
			textChannel: this.textChannel,
			mute: options.mute ?? this.mute,
		});

		return this;
	}

	public set(key: string, value: unknown) {
		return (this.data[key] = value);
	}

	public get<K>(key: string): K {
		return this.data[key] as K;
	}

	/** Disconnects the player. */
	public disconnect() {
		if (!this.voiceChannel) return;
		this.pause(true);
		this.isConnected = false;

		this.send({
			guild_id: this.guildId,
			channel_id: null,
		});

		delete this.voiceChannel;
		return this;
	}

	/** Destroys the player. */
	public destroy() {
		this.disconnect();
		this.node.rest.destroyPlayer(this.guildId);
		this.automata.players.delete(this.guildId);
	}

	/** Restarts the player. */
	public restart() {
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

	/** Moves the player to another node. */
	public moveNode(name: string) {
		const node = this.automata.nodes.get(name);
		if (!node || node.name === this.node.name) return;
		if (!node.isConnected) throw new Error('The node provided is not available.');

		this.node.rest.destroyPlayer(this.guildId);
		this.automata.players.delete(this.guildId);
		this.node = node;
		this.automata.players.set(this.guildId, this);
		this.restart();
	}

	/** Automatically moves the node. */
	public AutoMoveNode() {
		const [node] = this.automata.leastUsedNodes;
		if (!node) throw new Error('There aren\'t any available nodes.');
		if (!this.automata.nodes.has(node.name)) return this.destroy();

		this.moveNode(node.name);
	}

	/** Handles lavalink related events. */
	public eventHandler(data: EventInterface) {
		switch (data.type) {
		case 'TrackStartEvent': {
			this.isPlaying = true;
			this.automata.emit('playerStart', this, this.queue.current);
			break;
		}
		case 'TrackEndEvent': {
			this.queue.previous = this.queue.current;
			if (this.loop === 'TRACK') {
				this.queue.unshift(this.queue.previous);
				this.automata.emit('playerEnd', this, this.queue.current);
				return this.play();
			}
			else if (this.queue.current && this.loop === 'QUEUE') {
				this.queue.push(this.queue.previous);
				this.automata.emit('playerEnd', this, this.queue.current, data);
				return this.play();
			}

			if (this.queue.length === 0) {
				this.isPlaying = false;
				return this.automata.emit('playerDisconnect', this);
			}
			else if (this.queue.length > 0) {
				this.automata.emit('playerEnd', this, this.queue.current);
				return this.play();
			}

			this.isPlaying = false;
			this.automata.emit('playerDisconnect', this);
			break;
		}

		case 'TrackStuckEvent': {
			this.automata.emit('playerError', this, this.queue.current, data);
			this.stop();
			break;
		}
		case 'TrackExceptionEvent': {
			this.automata.emit('playerError', this, this.queue.current, data);
			this.stop();
			break;
		}
		case 'WebSocketClosedEvent': {
			if ([4015, 4009].includes(data.code)) {
				this.send({
					guild_id: data.guildId,
					channel_id: this.voiceChannel,
					self_mute: this.mute,
					self_deaf: this.deaf,
				});
			}
			this.automata.emit('playerClose', this, this.queue.current, data);
			this.pause(true);
			break;
		}
		default: break;
		}
	}

	/** Resolves the provided query. */
	async resolve({ query, source, requester }: ResolveOptions) {
		const regex = /^https?:\/\//;
		let url: RouteLike;

		if (regex.test(query)) url = `/v3/loadtracks?identifier=${encodeURIComponent(query)}`;
		else url = `/v3/loadtracks?identifier=${encodeURIComponent(
			`${source || 'dzsearch'}:${query}`,
		)}`;

		const response = await this.node.rest.get(url);
		return new Track(response, requester);
	}

	/** Sends the data to the Lavalink node the old fashioned way. */
	public send(data: object) {
		this.automata.send({ op: 4, d: data });
	}
}

interface EventInterface {
  encodedTrack: string;
  track: string;
  guildId: string;
  op: 'event';
  code?: number;
  type:
    | 'TrackStartEvent'
    | 'TrackEndEvent'
    | 'TrackStuckEvent'
    | 'TrackExceptionEvent'
    | 'WebSocketClosedEvent'
}

export type Loop = 'NONE' | 'TRACK' | 'QUEUE';