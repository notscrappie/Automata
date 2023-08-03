import { RequestMethod } from '../Utils/Utils';
import { fetch } from 'undici';
import { Node } from './Node';

/** Handles the requests sent to the Lavalink REST API. */
export class Rest {
	/** The ID of the current session. */
	private sessionId: string;
	/** The password for the Node. */
	private readonly password: string;
	/** The URL of the Node. */
	private readonly url: string;

	constructor(node: Node) {
		this.url = `http${node.options.secure ? 's' : ''}://${node.options.host}:${
			node.options.port
		}`;
		this.sessionId = node.sessionId;
		this.password = node.options.password;
	}

	/**
	 * Sets the session ID.
	 * @returns {string} Returns the session ID.
	 */
	public setSessionId(sessionId: string): string {
		this.sessionId = sessionId;
		return this.sessionId;
	}

	/** Retrieves all the players that are currently running on the node. */
	public getAllPlayers(): Promise<unknown> {
		return this.get(`/v4/sessions/${this.sessionId}/players`);
	}

	/** Sends a PATCH request to update player related data. */
	public async updatePlayer(options: playOptions): Promise<unknown> {
		const request = await this.patch(`/v4/sessions/${this.sessionId}/players/${options.guildId}?noReplace=false`, options.data);
		return request;
	}

	/** Sends a DELETE request to the server to destroy the player. */
	public async destroyPlayer(guildId: string) {
		const request = await this.delete(`/v4/sessions/${this.sessionId}/players/${guildId}`);
		return request;
	}

	/* Sends a GET request to the specified endpoint and returns the response data. */
	public async get(path: RouteLike): Promise<unknown> {
		try {
			const req = await fetch(this.url + path, {
				method: RequestMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					Authorization: this.password,
				},
			});

			const json = await req.json();
			return json;
		}
		catch (e) {
			return null;
		}
	}

	/* Sends a PATCH request to the specified endpoint and returns the response data. */
	public async patch(endpoint: RouteLike, body: unknown): Promise<unknown> {
		try {
			const req = await fetch(this.url + endpoint, {
				method: RequestMethod.Patch,
				headers: {
					'Content-Type': 'application/json',
					Authorization: this.password,
				},
				body: JSON.stringify(body),
			});

			const json = await req.json();
			return json;
		}
		catch (e) {
			return null;
		}
	}

	/* Sends a POST request to the specified endpoint and returns the response data. */
	public async post(endpoint: RouteLike, body: unknown): Promise<unknown> {
		try {
			const req = await fetch(this.url + endpoint, {
				method: RequestMethod.Post,
				headers: {
					'Content-Type': 'application/json',
					Authorization: this.password,
				},
				body: JSON.stringify(body),
			});

			const json = await req.json();
			return json;
		}
		catch (e) {
			return null;
		}
	}

	/* Sends a DELETE request to the specified endpoint and returns the response data. */
	public async delete(endpoint: RouteLike): Promise<unknown> {
		try {
			const req = await fetch(this.url + endpoint, {
				method: RequestMethod.Delete,
				headers: {
					'Content-Type': 'application/json',
					Authorization: this.password,
				},
			});

			const json = await req.json();
			return json;
		}
		catch (e) {
			return null;
		}
	}
}

interface playOptions {
  guildId: string;
  data: {
    encodedTrack?: string;
    identifier?: string;
    startTime?: number;
    endTime?: number;
    volume?: number;
    position?: number;
    paused?: boolean;
    filters?: object;
    voice?: unknown;
  };
}

type RouteLike = `/${string}`;
