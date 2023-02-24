import { EventEmitter } from "node:events";

export interface PlaylistInfo {
  name: string;
  selectedTrack: number;
}

export interface IvoiceServer {
  token: string;
  guild_id: string;
  endpoint: string | null;
}

export interface ResolveResponse {
  loadType:
  | "TRACK_LOADED"
  | "PLAYLIST_LOADED"
  | "SEARCH_RESULT"
  | "NO_MATCHES"
  | "LOAD_FAILED";
  tracks: AutomataTrack[];
  playlistInfo: PlaylistInfo;
}

export class AutomataTrack {
  constructor(data: string): this;
  track: string;
  info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    sourceName: string;
    title: string;
    uri: string;
    requester?: object | string | null;
    image: string | null;
  };
  resolve: (manager: Automata) => Promise<ResolveResponse>;
}

export class Queue extends Array<AutomataTrack> {
  constructor(...args: any[]): this;
  get size(): number;
  first: () => AutomataTrack;
  add: (track: AutomataTrack) => Queue;
  remove: (index: number) => Queue;
  clear: () => Queue;
  shuffle: () => void;
}

export interface NodeStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
}

export interface NodeOptions {
  name?: string;
  host?: string;
  port?: number;
  password?: string;
  secure?: boolean;
}

export interface AutomataOptions {
  defaultPlatform?: string;
  reconnectTimeout?: number;
  reconnectTries?: number;
  resumeKey?: string;
  resumeTimeout?: number;
};

export class voiceConnection {
  constructor(player: Player): this;
  player: Player;
  sessionId: string | null;;
  region = string | null;
  muted = boolean | false;
  deafened = boolean | false;
  voiceServer = IvoiceServer | null;
};

export class Node implements INode {
  constructor(manager: Automata, options: NodeOptions, node: AutomataOptions): this;
  name: string | null;
  host: string;
  port: number;
  password: string;
  secure: boolean;
  manager: Automata;
  url: string;
  reconnectTimeout: number;
  reconnectTries: number;
  reconnectAttempt: boolean;
  attempt: number;
  resumeKey: string | null;
  resumeTimeout: string;
  reconnects: number;
  isConnected: boolean;
  destroyed: boolean | null;
  stats: NodeStats;
  connect: () => void;
  disconnect: () => void;
  destroy: () => void;
  reconnect: () => void;
  send: (payload: any) => void;
  get penalties(): number;
}

interface AutomataEvents {
  nodeConnect: (node: Node) => void;
  nodeClose: (node: Node) => void;
  nodeError: (node: Node, event: any) => void;
  trackStart: (player: Player, track: AutomataTrack, payload: LavalinkEvents) => void;
  playerUpdate: (
    player: Player,
    data: {
      op: "playerUpdate";
      guildId: string;
      state: {
        time: number;
        position: number;
        connected: boolean;
        ping: number;
      };
    }
  ) => void;
  trackEnd: (player: Player, track: AutomataTrack, payload: LavalinkEvents) => void;
  trackError: (player: Player, track: AutomataTrack, payload: LavalinkEvents) => void;
  socketClosed: (
    player: Player,
    data: {
      op: "event";
      type: "WebSocketClosedEvent";
      guildId: string;
      code: number;
      reason: string;
      byRemote: boolean;
    }
  ) => void;
  queueEnd: (player: Player, track: AutomataTrack, payload: LavalinkEvents) => void;
  playerCreate: (player: Player) => void;
  playerDestroy: (player: Player) => void;
  nodeDestroy: (node: Node) => void;
  nodeReconnect: (node: Node) => void;
}

export class Automata extends EventEmitter {
  constructor(client: any, nodes: NodeOptions[], options?: AutomataOptions): this;
  on<U extends keyof AutomataEvents>(event: U, listener: AutomataEvents[U]): this;
  emit<U extends keyof AutomataEvents>(
    event: U,
    ...args: Parameters<AutomataEvents[U]>
  ): boolean;

  client: any;
  _nodes: Node[];
  nodes: Map<string, Node>;
  players: Map<string, Player>;
  isActive: boolean;
  user: string | null;
  options: AutomataOptions;
  sendData: null;
  version: string;
  spotify: any;
  apple: any;
  deezer: any;
  init: (client: any) => void;
  addNode: (options: NodeOptions) => Node;
  removeNode: (name: string) => void;
  get leastUsedNodes(): Node[];
  getNode: (name: "best" | string) => Node;
  checkConnection: (options: {
    guildId: string;
    voiceChannel: string;
    textChannel: string;
  }) => void;
  create: (options: {
    guildId: string;
    voiceChannel: string;
    textChannel?: string;
    deaf?: boolean;
    mute?: boolean;
  }) => Player;
  removeConnection: (guildId: string) => void;
  packetUpdate: (packet: {
    t: string;
    d: {
      guild_id: string;
    };
  }) => void;
  resolve: (query: string, source?: string) => Promise<ResolveResponse>;
  fetchURL: (node: Node, track: AutomataTrack) => Promise<ResolveResponse>;
  fetchTrack: (
    node: Node,
    query: string,
    source?: string
  ) => Promise<ResolveResponse>;
  decodeTrack: (track: AutomataTrack) => Promise<AutomataTrack>;
  get: (identifier: string) => Player;
}

export type PlayerLoopModes = "NONE" | "TRACK" | "QUEUE";
export type LavalinkEvents =
  | "TrackStartEvent"
  | "TrackEndEvent"
  | "TrackExceptionEvent"
  | "TrackStuckEvent"
  | "WebSocketClosedEvent";

export interface PlayerOptions {
  guildId: string;
  voiceChannel:
  | {
    id: string;
  }
  | string;
  textChannel?: string;
  mute?: boolean;
  deaf?: boolean;
}

export class Player extends EventEmitter {
  constructor(manager: Automata, node: Node, options: PlayerOptions): this;
  manager: Automata;
  queue: Queue;
  node: Node;
  options: PlayerOptions;
  guildId: string;
  voiceChannel: string;
  textChannel: string;
  isConnected: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  loop: PlayerLoopModes;
  position: number;
  ping: number;
  currentTrack: AutomataTrack | null;
  previousTracks: AutomataTrack;
  connection: voiceConnection

  play: (options?: { noReplace?: boolean }) => Promise<Player>;
  stop: () => Player;
  pause: (pause: boolean) => Player;
  seekTo: (position: number) => Promise<Player>;
  setVolume: (volume: number) => Player;
  setLoop: (mode: PlayerLoopModes) => Player;
  setTextChannel: (channel: string) => Player;
  setVoiceChannel: (channel: string) => Player;
  connect: (options: {
    guildId: string;
    voiceChannel: string;
    deaf: boolean;
    mute: boolean;
  }) => void;
  reconnect: () => Player;
  disconnect: () => Player;
  destroy: () => void;
  restart: () => void;
  autoplay: (option: boolean) => void;
  send: (payload: any) => void;
  lavalinkEvent: (data: LavalinkEvents) => void;
}
