import { Player } from './Player';

export class Connection {
	public player: Player;
	public sessionId: string | null;
	public region: string | null;
	public voice: IVoiceServer | null;
	public self_mute: boolean;
	public self_deaf: boolean;

	constructor(player: Player) {
		this.player = player;
		this.sessionId = null;
		this.region = null;
		this.voice = {
			sessionId: null,
			token: null,
			endpoint: null,
		};
		this.self_mute = false;
		this.self_deaf = false;
	}

	/** Updates server information for the player's voice connection. */
	public setServersUpdate({ endpoint, token }: { endpoint: string; token: string }): void {
		if (!endpoint) throw new Error('NO Session id found');

		this.voice.endpoint = endpoint;
		this.voice.token = token;

		this.region = endpoint.split('.').shift()?.replace(/[0-9]/g, '') ?? null;

		this.player.node.rest.updatePlayer({
			guildId: this.player.guildId,
			data: { voice: this.voice },
		});
	}

	/** Updates the state of the player. */
	setStateUpdate({ session_id, channel_id, self_deaf, self_mute }: any) {
		if (
			this.player.voiceChannel &&
      channel_id &&
      this.player.voiceChannel !== channel_id
		) this.player.voiceChannel = channel_id;

		this.self_deaf = self_deaf ?? true;
		this.self_mute = self_mute ?? false;
		this.voice.sessionId = session_id ?? null;
	}
}

interface IVoiceServer {
  token: string;
  sessionId: string;
  endpoint: string;
}