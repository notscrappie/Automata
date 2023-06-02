export const defaultOptions = {
	/** The name of the client that will be connecting to the node. */
	clientName: 'automata@shadowrunners',
};

export interface NodeStats {
	players: number;
	playingPlayers: number;
	memory: {
		reservable: number;
		used: number;
		free: number;
		allocated: number;
	};
	frameStats: {
		sent: number;
		deficit: number;
		nulled: number;
	};
	cpu: {
		cores: number;
		systemLoad: number;
		lavalinkLoad: number;
	};
	uptime: number;
}

export interface NodeOptions {
	/** Name of the node. */
	name: string;
	/** IP of the node. */
	host: string;
	/** Port of the node. */
	port: number;
	/** Password of the node. */
	password: string;
	/** Requires to be set as true when the node has SSL enabled. Otherwise, it can be left disabled. */
	secure?: boolean;
	/** Allows you to set this node to be used across specific regions. */
	region?: string[];
}

export interface EventInterface {
	/** The type of the event. */
	type: string;
	/** The OP code of the event. */
	code: number;
	/** The ID of the guild where the event occured. */
	guildId: string;
}

// eslint-disable-next-line no-shadow
export enum RequestMethod {
	'Get' = 'GET',
	'Delete' = 'DELETE',
	'Post' = 'POST',
	'Patch' = 'PATCH',
	'Put' = 'PUT',
}