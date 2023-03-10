"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestMethod = exports.Rest = void 0;
const undici_1 = require("undici");
class Rest {
    sessionId;
    password;
    url;
    automata;
    constructor(automata, node) {
        this.automata = automata;
        this.url = `http${node.secure ? "s" : ""}://${node.options.host}:${node.options.port}`;
        this.sessionId = node.sessionId;
        this.password = node.password;
    }
    /** Sets the session ID. */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    /** Retrieves all the players that are currently running on the node. */
    getAllPlayers() {
        return this.get(`/v3/sessions/${this.sessionId}/players`);
    }
    /** Sends a PATCH request to update player related data. */
    async updatePlayer(options) {
        return await this.patch(`/v3/sessions/${this.sessionId}/players/${options.guildId}/?noReplace=false`, options.data);
    }
    /** Sends a DELETE request to the server to destroy the player. */
    async destroyPlayer(guildId) {
        await this.delete(`/v3/sessions/${this.sessionId}/players/${guildId}`);
    }
    /* Sends a GET request to the specified endpoint and returns the response data. */
    async get(path) {
        try {
            const req = await (0, undici_1.fetch)(this.url + path, {
                method: RequestMethod.Get,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.password,
                },
            });
            return await req.json();
        }
        catch (e) {
            return null;
        }
    }
    /* Sends a PATCH request to the specified endpoint and returns the response data. */
    async patch(endpoint, body) {
        try {
            const req = await (0, undici_1.fetch)(this.url + endpoint, {
                method: RequestMethod.Patch,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.password,
                },
                body: JSON.stringify(body),
            });
            return await req.json();
        }
        catch (e) {
            return null;
        }
    }
    ;
    /* Sends a POST request to the specified endpoint and returns the response data. */
    async post(endpoint, body) {
        try {
            const req = await (0, undici_1.fetch)(this.url + endpoint, {
                method: RequestMethod.Post,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.password,
                },
                body: JSON.stringify(body),
            });
            return await req.json();
        }
        catch (e) {
            return null;
        }
    }
    /* Sends a DELETE request to the specified endpoint and returns the response data. */
    async delete(endpoint) {
        try {
            const req = await (0, undici_1.fetch)(this.url + endpoint, {
                method: RequestMethod.Delete,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.password,
                },
            });
            return await req.json();
        }
        catch (e) {
            return null;
        }
    }
}
exports.Rest = Rest;
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["Get"] = "GET";
    RequestMethod["Delete"] = "DELETE";
    RequestMethod["Post"] = "POST";
    RequestMethod["Patch"] = "PATCH";
    RequestMethod["Put"] = "PUT";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
//# sourceMappingURL=Rest.js.map