import { Manager, AutomataOptions, NodeOptions } from "../Manager";
import WebSocket from "ws";
import { Rest } from "./Rest";
import { Player } from "../Player/Player";

export class Node {
  public isConnected: boolean;
  public automata: Manager;
  public readonly name: string;
  public readonly restURL: string;
  public readonly socketURL: string;
  public password: string;
  public readonly secure: boolean;
  public readonly regions: Array<string>;
  public sessionId: string;
  public rest: Rest;
  public ws: WebSocket | null;
  public readonly resumeKey: string | null;
  public readonly resumeTimeout: number;
  public readonly autoResume: boolean;
  public readonly reconnectTimeout: number;
  public reconnectTries: number;
  public reconnectAttempt: any;
  public attempt: number;
  public stats: NodeStats | null;
  public options: NodeOptions;

  constructor(automata: Manager, node: NodeOptions, options: AutomataOptions) {
    this.automata = automata;
    this.name = node.name;
    this.options = node;
    this.restURL = `http${node.secure ? "s" : ""}://${node.host}:${node.port}`;
    this.socketURL = `${this.secure ? "wss" : "ws"}://${node.host}:${node.port}/`;
    this.password = node.password || "youshallnotpass";
    this.secure = node.secure || false;
    this.regions = node.region || null;
    this.sessionId = null;
    this.rest = new Rest(automata, this);
    this.ws = null;
    this.resumeKey = options.resumeKey || null;
    this.resumeTimeout = options.resumeTimeout || 60;
    this.reconnectTimeout = options.reconnectTimeout || 5000;
    this.reconnectTries = options.reconnectTries || 5;
    this.reconnectAttempt = null;
    this.attempt = 0;
    this.isConnected = false;
    this.stats = null;
  }

  /** Connects to the Lavalink server using the WebSocket. */
  public connect(): void {
    if (this.ws) this.ws.close();

    const headers = {
      Authorization: this.password,
      "User-Id": this.automata.userId,
      "Client-Name": "Shadowrunners - Automata Client",
    };

    if (this.resumeKey) headers["Resume-Key"] = this.resumeKey;

    this.ws = new WebSocket(this.socketURL, { headers });
    this.ws.on("open", () => this.open());
    this.ws.on("error", (error: any) => this.error(error));
    this.ws.on("message", (message: string) => this.message(message));
    this.ws.on("close", (code: string) => this.close(code));
  }

  /** Sends the payload to the Lavalink server. */
  public async send(payload: any): Promise<void> {
    const data = JSON.stringify(payload);
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(data);
    else await new Promise<void>((resolve, reject) => {
      this.ws.once("open", () => {
        this.ws.send(data);
        resolve();
      });
      this.ws.once("error", (error: any) => {
        reject(error);
      });
    });
  }

  /** Reconnects the client to the Lavalink server. */
  public reconnect() {
    this.reconnectAttempt = setTimeout(() => {      
      this.isConnected = false;
      this.ws?.removeAllListeners();
      this.ws = null;
      this.automata.emit("nodeReconnect", this);
      this.connect();
      this.attempt++;
    }, this.reconnectTimeout);
  }

  /** Disconnects the client from the Lavalink server. */
  public async disconnect() {
    if (!this.isConnected) return;

    let player;
    const playersToMove: Player[] = [];

    for (player of this.automata.players) {
      if (player.node === this) playersToMove.push(player);
    }

    await Promise.all(playersToMove.map((player) => player.AutoMoveNode()));

    this.ws.close(1000, "destroy");
    this.ws?.removeAllListeners();
    this.automata.nodes.delete(this.name);
    this.automata.emit("nodeDisconnect", this);
  }

  /** Returns the penalty of the current node based on its statistics. */
  get penalties(): number {
    let penalties = 0;
    const { players, cpu, frameStats } = this.stats;

    penalties += players;
    penalties += Math.round(Math.pow(1.05, 100 * cpu.systemLoad) * 10 - 10);

    if (this.stats.frameStats) {
      penalties += frameStats.deficit;
      penalties += frameStats.nulled * 2;
    }

    return penalties;
  }

  /** Handles the 'open' event of the WebSocket connection. */
  private open(): void {
    if (this.reconnectAttempt) {
      clearTimeout(this.reconnectAttempt);
      delete this.reconnectAttempt;
    }

    this.automata.emit("nodeConnect", this);
    this.isConnected = true;

    if (this.autoResume) {
      for (const [_, player] of this.automata.players) {
        if (player.node === this) player.restart?.();
      }
    }
  }

  /** Sets the stats. */
  private setStats(packet: NodeStats) {
    this.stats = packet;
  }

  /** Handles the message received from the Lavalink node. */
  private message(payload: any): void {
    const { sessionId, resumeKey, resumeTimeout } = this;
    const packet = JSON.parse(payload);
    this.automata.emit("raw", "Node", packet)

    switch (packet.op) {
      case "stats": 
        delete packet.op;
        this.setStats(packet);
        break;
      case "ready":
        this.rest.setSessionId(packet.sessionId);
        this.sessionId = packet.sessionId;
        if (this.resumeKey) 
          this.rest.patch(`/v3/sessions/${sessionId}`, { resumingKey: resumeKey, timeout: resumeTimeout });
        break;
      default:
      const player = this.automata.players.get(packet.guildId);
      if (player) player.emit(packet.op, packet);
      break;
    }
  }
    
  /** Handles the 'close' event of the WebSocket connection. */
  private close(event: any): void {
    this.disconnect();
    this.automata.emit("nodeDisconnect", this, event);
    if (event !== 1000) this.reconnect();
  }

  /** Handles the 'error' event of the WebSocket connection. */
  private error(event: any): void {
    if (!event) return;
    this.automata.emit("nodeError", this, event);
  }

  /** Gets the route planner's current status. */
  public async getRoutePlannerStatus(): Promise<any> {
    return await this.rest.get(`/v3/routeplanner/status`);
  }

  /** Removes a failed address from the route planner's blacklist. */
  public unmarkFailedAddress(address: string): Promise<any> {
    return this.rest.post(`/v3/routeplanner/free/address`, { address })
  }
}

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
