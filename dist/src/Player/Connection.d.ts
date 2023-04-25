import { Player } from './Player';
export declare class Connection {
    player: Player;
    sessionId: string | null;
    region: string | null;
    voice: IVoiceServer | null;
    self_mute: boolean;
    self_deaf: boolean;
    constructor(player: Player);
    /** Updates server information for the player's voice connection. */
    setServersUpdate({ endpoint, token }: {
        endpoint: string;
        token: string;
    }): void;
    /** Updates the state of the player. */
    setStateUpdate({ session_id, channel_id, self_deaf, self_mute }: VoiceState): void;
}
interface VoiceState {
    session_id: string;
    channel_id: string;
    self_deaf: boolean;
    self_mute: boolean;
}
interface IVoiceServer {
    token: string;
    sessionId: string;
    endpoint: string;
}
export {};
