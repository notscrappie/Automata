import { defaultOptions, NodeStats, EventInterface, NodeOptions } from '../Utils/Utils';
import { validateOptions } from '../Utils/ValidateOptions';
import { Manager, AutomataOptions } from '../Manager';
import { WebSocket } from 'ws';
import { Rest } from './Rest';
import { Player } from '../Player/Player';

/** Manages the connection between the client and the Lavalink server. */
export class Node {
	/** The manager. */
	protected automata: Manager;
	/** The node options. */
	public readonly options: NodeOptions;
	/** The manager options. */
	private managerOptions: AutomataOptions;
	/** The Rest URL. */
	protected restURL: string;
	/** The socket's URL. */
	private readonly socketURL: string;
	/** Indicates whether the client has connected to the node or not. */
	public isConnected: boolean;
	/** The array of regions. */
	public readonly regions: Array<string>;
	/** The node's session ID. */
	public sessionId: string | null;
	/** The REST instance. */
	public readonly rest: Rest;
	/** The WS instance. */
	private ws: WebSocket | null;
	/** The reconnect attempt. */
	private reconnectAttempt: NodeJS.Timeout;
	/** The attempt it's currently on. */
	private attempt: number;
	/** The node's stats. */
	public stats: NodeStats;

	constructor(automata: Manager, node: NodeOptions, options: AutomataOptions) {
		this.options = node;
		this.managerOptions = options;
		validateOptions(this.options, options);

		this.automata = automata;
		this.rest = new Rest(this);
		this.restURL = `http${node.secure ? 's' : ''}://${node.host}:${node.port}`;
		this.socketURL = `${node.secure ? 'wss' : 'ws'}://${node.host}:${node.port}/v4/websocket`;
	}

	/** Connects to the Lavalink server using the WebSocket. */
	public connect(): void {
		const headers = Object.assign({
			Authorization: this.options.password,
			'User-Id': this.automata.userId,
			'Client-Name': defaultOptions.clientName,
		});

		this.ws = new WebSocket(this.socketURL, { headers });
		this.ws.on('open', this.open.bind(this));
		this.ws.on('error', this.error.bind(this));
		this.ws.on('message', this.message.bind(this));
		this.ws.on('close', this.close.bind(this));
	}

	/** Sends the payload to the Node. */
	public send(payload: unknown): void {
		const data = JSON.stringify(payload);
		try {
			this.ws.send(data);
			return null;
		}
		catch (error) {
			return error;
		}
	}

	/** Reconnects the client to the Node. */
	public reconnect(): void {
		this.reconnectAttempt = setTimeout(() => {
			if (this.attempt > this.managerOptions.reconnectTries) this.automata.emit('nodeError', this);

			this.isConnected = false;
			this.ws?.removeAllListeners();
			this.ws = null;
			this.automata.emit('nodeReconnect', this);
			this.connect();
			this.attempt++;
		}, this.managerOptions.reconnectTimeout);
	}

	/** Disconnects the client from the Node. */
	public disconnect(): void {
		if (!this.isConnected) return;

		this.automata.players.forEach((player) => {
			player.AutoMoveNode();
		});

		this.ws.close(1000, 'destroy');
		this.ws = null;

		this.automata.nodes.delete(this.options.name);
		this.automata.emit('nodeDisconnect', this);
	}

	/**
	 * Returns the penalty of the current node based on its statistics.
	 * @returns The penalty of the node.
	 */
	get penalties(): number {
		if (!this.isConnected) return 0;
		return this.stats.players +
            Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10) +
            (this.stats.frameStats?.deficit ?? 0) +
            (this.stats.frameStats?.nulled ?? 0) * 2;

	}

	/** Handles the 'open' event of the WebSocket connection. */
	private open(): void {
		if (this.reconnectAttempt) {
			clearTimeout(this.reconnectAttempt);
			delete this.reconnectAttempt;
		}

		this.automata.emit('nodeConnect', this);
		this.isConnected = true;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [_, player] of this.automata.players) {
			if (player.node === this) player.restart();
		}
	}

	/** Sets the stats. */
	private setStats(packet: NodeStats) {
		this.stats = packet;
		return packet;
	}

	/** Handles the message received from the Lavalink node. */
	private message(payload: string): void {
		const packet = JSON.parse(payload);
		const player = this.automata.players.get(packet.guildId);

		this.automata.emit('raw', 'Node', packet);

		switch (packet.op) {
		case 'stats':
			delete packet.op;
			this.setStats(packet);
			break;
		case 'playerUpdate':
			if (!player) return;

			player.isConnected = packet.state.connected;
			player.position = packet.state.position;
			player.ping = packet.state.ping;
			player.timestamp = packet.state.time;

			break;
		case 'event':
			this.eventHandler(packet);
			break;
		case 'ready':
			this.rest.setSessionId(packet.sessionId);
			this.sessionId = packet.sessionId;

			if (this.managerOptions.resumeStatus)
				this.rest.patch(`/v4/sessions/${this.sessionId}`, {
					resuming: this.managerOptions.resumeStatus,
					timeout: this.managerOptions.resumeTimeout,
				});
			break;
		default:
			this.automata.emit('nodeError', this, new Error(`Unexpected op "${packet.op}" with data: ${payload}`));
			break;
		}
	}

	/** Handles the 'close' event of the WebSocket connection. */
	private close(event: number): boolean {
		if (!event) return;
		return this.automata.emit('nodeDisconnect', this, event);
	}

	/** Handles the 'error' event of the WebSocket connection. */
	private error(event: number): boolean {
		if (!event) return;
		return this.automata.emit('nodeError', this, event);
	}

	/**
	 * Handles lavalink related events.
	 * @param data The event data.
	 */
	private eventHandler(data: EventInterface): void {
		if (!data.guildId) return;
		const player = this.automata.players.get(data.guildId);

		switch (data.type) {
			case 'TrackStartEvent':
				this.TrackStartEvent(player);
				break;
			case 'TrackEndEvent':
				this.TrackEndEvent(player);
				break;
			case 'TrackStuckEvent':
				this.TrackStuckEvent(player, data);
				break;
			case 'TrackExceptionEvent':
				this.TrackExceptionEvent(player, data);
				break;
			case 'WebSocketClosedEvent':
				this.WebSocketClosedEvent(player, data);
				break;
			default:
				break;
		}
	}

	/** 
	 * Handles the TrackStart event. 
	 * @param player The player.
	 * @returns {void}
	 */
	private TrackStartEvent(player: Player): void {
		if (player.loop === 'TRACK') return;
		
		player.isPlaying = true;
		this.automata.emit('trackStart', player, player.queue.current);
	}

	/** 
	 * Handles the TrackEnd event. 
	 * @param player The player.
	 * @returns {boolean | void}
	*/
	private TrackEndEvent(player: Player): boolean | void {
		player.queue.previous = player.queue.current;

		if (player.loop === 'TRACK') {
			player.queue.unshift(player.queue.previous);
			return player.play();
		}
		else if (player.queue.current && player.loop === 'QUEUE') 
			player.queue.push(player.queue.previous);

		if (player.nowPlayingMessage && !player.nowPlayingMessage.deleted)
			player.nowPlayingMessage.delete().catch(() => { 
				// This is here so DeepSource doesn't fucking complain again.
			});
				
		if (player.queue.length === 0) {
			player.isPlaying = false;
			return this.automata.emit('queueEnd', player);
		} else this.automata.emit('trackEnd', player, player.queue.current);
		
		return player.play();
	}

	/**
	 * Handles the TrackStuckEvent.
	 * @param player The player.
	 * @param data The event data.
	 * @returns {void}
	 */
	private TrackStuckEvent(player: Player, data: EventInterface): void {
		this.automata.emit('trackStuck', player, player.queue.current, data);
		return player.stop();
	}

	/**
	 * Handles the TrackExceptionEvent.
	 * @param player The player.
	 * @param data The event data.
	 * @returns {void}
	 */
	private TrackExceptionEvent(player: Player, data: EventInterface): void {
		this.automata.emit('trackStuck', player, player.queue.current, data);
		return player.stop();
	}

	/**
	 * Handles the WebSocketClosedEvent.
	 * @param player The player.
	 * @param data The event data.
	 * @returns {void}
	 */
	private WebSocketClosedEvent(player: Player, data: EventInterface): void {
		if ([4015, 4009].includes(data.code))
			this.send({
				guild_id: data.guildId,
				channel_id: player.voiceChannel,
				self_mute: player.options.mute,
				self_deaf: player.options.deaf,
			});
	
		this.automata.emit('socketClose', player, data);
	}
}

