export interface PlayOptions {
    /** The ID of the guild. */
    guildId: string;
    /** The data object that is passed to the updatePlayer function. */
    data: {
      /** The Base64 encoded track. */
      encodedTrack?: string;
      /** The name of the track. */
      identifier?: string;
      /** The time when the track starts. */
      startTime?: number;
      /** The time when the track ends. */
      endTime?: number;
      /** The volume the track is playing at. */
      volume?: number;
      /** The position of the track. */
      position?: number;
      /** The boolean indicating if the track is paused or not. */
      paused?: boolean;
      /** The filters that are currently active. */
      filters?: object;
      /** The voice property (don't really know what it is tho, never logged it). */
      voice?: unknown;
    };
  }

export type RouteLike = `/${string}`;

// eslint-disable-next-line no-shadow
export enum RequestMethod {
	'Get' = 'GET',
	'Delete' = 'DELETE',
	'Post' = 'POST',
	'Patch' = 'PATCH',
	'Put' = 'PUT',
}