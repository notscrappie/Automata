import { ServerUpdatePacket } from '../Manager';
import { Player } from './Player';

/** Represents the connection for the player's voice communication. */
export class Connection {
	/** The associated player. */
	public player: Player;
	/** The session ID for the voice connection. */
	public sessionId: string | null;
	/** The region for the voice connection. */
	public region: string | null;
	/** The voice server information. */
	public voice: IVoiceServer | null;
	/** Indicates whether the player is self-muted. */
	public self_mute: boolean;
	/** Indicates whether the player is self-deafened. */
	public self_deaf: boolean;

	constructor(player: Player) {
		this.player = player;
		this.sessionId = null;
		this.region = null;
		this.voice = null;
		this.self_mute = false;
		this.self_deaf = false;
	}

	/**
	 * Updates server information for the player's voice connection.
     * @param endpoint - The voice server endpoint.
     * @param token - The voice connection token.
	 * @returns {void}
	 */
	public setServersUpdate({ endpoint, token }: ServerUpdatePacket): void {
		if (!endpoint) throw new Error('Automata · No session ID found.');

		this.voice = {
			sessionId: null,
			token,
			endpoint,
		};

		this.region = endpoint.split('.').shift()?.replace(/[0-9]/g, '') ?? null;

		this.player.node.rest.updatePlayer({
			guildId: this.player.guildId,
			data: { voice: this.voice },
		});
	}

	/**
     * Updates the state of the player's voice connection.
     * @param data - The state update data.
	 * @returns {void}
     */
	public setStateUpdate(data: StateUpdate): void {
		if (!data.channel_id) this.player.destroy();

		if (this.player.voiceChannel && data.channel_id && this.player.voiceChannel !== data.channel_id)
			this.player.voiceChannel = data.channel_id;

		this.self_deaf = data.self_deaf ?? true;
		this.self_mute = data.self_mute ?? false;
		this.voice.sessionId = data.session_id ?? null;
	}
}

interface IVoiceServer {
	/** The endpoint of the voice server. */
  token: string;
  /** The session ID of the voice server. */
  sessionId: string;
  /** The endpoint of the voice server. */
  endpoint: string;
}

interface StateUpdate {
	/** The ID of the channel that the player is currently connected to. */
	channel_id?: string;
	/** A boolean that indicates if the player has deafened itself. */
	self_deaf?: boolean;
	/** A boolean that indicates if the player has muted itself. */
	self_mute?: boolean;
	/** The ID of the session. */
	session_id?: string;
}