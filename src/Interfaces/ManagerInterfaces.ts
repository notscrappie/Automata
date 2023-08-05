/**
 * This file contains all the interfaces used by the Manager class.
 * Should make the file less cluttered.
 */

import { AutomataTrack, Player } from '../../index';
import { TrackData } from './TrackInterfaces';
import { NodeOptions } from '../Utils/Utils';

/** The final result built by the library. */
export interface ResolveResult {
	/** The load type. */
	loadType: LoadType;
	/** The array of tracks. */
	tracks: AutomataTrack[];
	/** The playlist data. */
	playlist: PlaylistData;
}

/** The result returned by the Lavalink node. */
export interface LavalinkResponse {
	/** The load type. */
	loadType: LoadType;
	/** The data from the Lavalink node. */
	data: TrackData | PlaylistData;
}

/** Represents the data of a playlist. */
export interface PlaylistData {
	/** The name of the playlist. */
	name?: string;
	/** The array of tracks. */
	tracks: TrackData[];
}

/** The type of load type. */
type LoadType =
	| 'track'
	| 'playlist'
	| 'search'
	| 'empty'
	| 'error'

/** The type of search platform. */
type SearchPlatform = 'spsearch' | 'dzsearch' | 'scsearch';

/** The options for resolving a track. */
export interface ResolveOptions {
	/** The query provided by the user. */
	query: string;
	/** The source that will be used to get the song from. */
	source?: SearchPlatform;
	/** The requester of the song. */
	requester?: unknown;
}

/** The options for creating a new Manager. */
export interface AutomataOptions {
	/** The nodes the player will use. */
	nodes: NodeOptions[];
	/** The default platform used by the manager. Default platform is Deezer, by default. */
	defaultPlatform?: SearchPlatform;
	/** The time the manager will wait before trying to reconnect to a node. */
	reconnectTimeout: number;
	/** The amount of times the player will try to reconnect to a node. */
	reconnectTries: number;
	/** The boolean that indicates if resuming is enabled or disabled. */
	resumeStatus: boolean;
	/** The time the manager will wait before trying to resume the previous session. */
	resumeTimeout: number;
}

/** The options for creating a new player. */
export interface ConnectionOptions {
	/** The ID of the guild where the player will be created. */
	guildId?: string;
	/** The ID of the guild's voice channel where the player will be created. */
	voiceChannel?: string;
	/** The ID of the guild's text channel where the player will send track related messages. */
	textChannel?: string;
	/** If you want the bot to be deafened on join, set this to true. Default is true. */
	deaf?: boolean;
	/** If you want the bot to be muted on join, set this to true. Default is false. */
	mute?: boolean;
	/** The RTC region of the voice channel. */
	region?: string;
}

/** The interface for all Automata events. */
export interface AutomataEvents {
	/**
	 * @param topic
	 * @param args
	 * Provides access to raw WS events. Can be used to handle custom or unknown events.
	 * @eventProperty
	 */
	raw: (topic: string, ...args: unknown[]) => void;

	/**
	 * Emitted when Automata successfully connects to a Lavalink node.
	 * @eventProperty
	 */
	nodeConnect: (node: Node) => void;

	/**
	 * Emitted when Automata loses the connection to a Lavalink node.
	 * @eventProperty
	 */
	nodeDisconnect: (node: Node, event?: unknown) => void;

	/**
	 * Emitted when Automata successfully reconnects to a Lavalink node.
	 * @eventProperty
	 */
	nodeReconnect: (node: Node) => void;

	/**
	 * Emitted when a Lavalink node related error occurs.
	 * @eventProperty
	 */
	nodeError: (node?: Node, event?: unknown) => void;

	/**
	 * Emitted when a player starts playing a new track.
	 * @eventProperty
	 */
	trackStart: (player: Player, track: AutomataTrack) => void;

	/**
	 * Emitted when the player finishes playing a track.
	 * @eventProperty
	 */
	trackEnd: (
		player: Player,
		track: AutomataTrack,
		LavalinkData?: unknown
	) => void;

	/**
	 * Emitted when the player's queue has finished.
	 * @eventProperty
	 */
	queueEnd: (player: Player) => void;

	/**
	 * Emitted when a track gets stuck while it is playing.
	 * @eventProperty
	 */
	trackStuck: (player: Player, track: AutomataTrack, data: unknown) => void;

	/**
   	 * Emitted when the player gets updated.
   	 * @eventProperty
   	 */
	playerUpdate: (player: Player) => void;

	/**
   	 * Emitted when a player gets destroyed.
   	 * @eventProperty
     */
	playerDestroy: (player: Player) => void;

	/**
	 * Emitted when the connection between the WebSocket and Discord voice servers drops.
	 * @eventProperty
	 */
	socketClose: (player: Player, data: unknown) => void;
}

export declare interface Manager {
	on<K extends keyof AutomataEvents>(
		event: K,
		listener: AutomataEvents[K]
	): this;
	once<K extends keyof AutomataEvents>(
		event: K,
		listener: AutomataEvents[K]
	): this;
	emit<K extends keyof AutomataEvents>(
		event: K,
		...args: Parameters<AutomataEvents[K]>
	): boolean;
	off<K extends keyof AutomataEvents>(
		event: K,
		listener: AutomataEvents[K]
	): this;
}

/** The voice packet returned by the VOICE_STATE_UPDATE event. */
export interface VoicePacket {
	/** The name of the event. */
	t?: string;
	d?: {
		/** The ID of the server where the event occured. */
		guild_id?: string;
		/** The ID of the player. */
		user_id?: string;
		/** The ID of the channel that the player is currently connected to. */
		channel_id?: string;
		/** A boolean that indicates if the player has deafened itself. */
		self_deaf?: boolean;
		/** A boolean that indicates if the player has muted itself. */
		self_mute?: boolean;
		/** The ID of the session. */
		session_id?: string;
	}
}

/** The server update packet returned by the VOICE_SERVER_UPDATE event. */
export interface ServerUpdatePacket {
	/** The token of the session. */
	token: string;
	/** The ID of the guild where the event occured. */
	guild_id: string;
	/** The endpoint of the voice server. */
	endpoint: string;
}

/** The discord.js client interface. */
export interface Client {
	/** The user object. */
    user: {
		/** The bot's ID. */
        id: string;
    };
	/** The bot's guilds map. */
    guilds: {
		/** The bot's guild cache. */
        cache: {
			/**
			 * Retrieves the server from the cache based on the provided guild ID.
			 * @param guildId The server's ID.
			 */
            get(guildId: string): {
				shard: {
					send(packet: VoicePacket): void;
				} | undefined;
			}
        };
    };
    on(eventName: 'raw', callback: (packet: VoicePacket) => void): void;
}

export interface IVoiceServer {
  /** The endpoint of the voice server. */
  token: string;
  /** The session ID of the voice server. */
  sessionId: string;
  /** The endpoint of the voice server. */
  endpoint: string;
}

export interface StateUpdate {
	/** The ID of the channel that the player is currently connected to. */
	channel_id?: string;
	/** A boolean that indicates if the player has deafened itself. */
	self_deaf?: boolean;
	/** A boolean that indicates if the player has muted itself. */
	self_mute?: boolean;
	/** The ID of the session. */
	session_id?: string;
}