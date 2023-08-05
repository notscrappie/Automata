export interface NowPlayingMessage {
	/** The ID of the channel. */
	channelId: string;
	/** The boolean indicating if the message has been deleted or not. */
	deleted?: boolean;
	/** The delete function. */
	delete: () => Promise<unknown>;
}

export type Loop = 'NONE' | 'TRACK' | 'QUEUE';