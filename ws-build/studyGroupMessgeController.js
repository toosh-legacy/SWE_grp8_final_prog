"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyGroupMessageController = void 0;
const ws_1 = require("ws");
const userMessageConnection_1 = require("./userMessageConnection");
class StudyGroupMessageController {
    activeUserConnections = [];
    /** Per-group message history. Key = studyGroupId. */
    messageHistory = new Map();
    /** Maximum messages to retain per group. */
    static MAX_HISTORY = 200;
    static isValidStudyGroup(studyGroupId) {
        return true;
    }
    constructor(port) {
        const wss = new ws_1.WebSocketServer({ port: port });
        wss.on("connection", (socket) => {
            console.log("-- HANDLING NEW CONNECTION --");
            socket.on("error", (err) => {
                console.error("[SOCKET ERROR - BEFORE HANDSHAKE]", {
                    message: err.message,
                    stack: err.stack
                });
            });
            const handleHandshake = (data) => {
                console.log("[HANDSHAKE RECEIVED]", {
                    raw: data?.toString?.()
                });
                let handshakeMessage;
                try {
                    handshakeMessage = JSON.parse(data.toString());
                    if (typeof handshakeMessage === "object" &&
                        typeof handshakeMessage.userId === "string" &&
                        typeof handshakeMessage.name === "string" &&
                        typeof handshakeMessage.studyGroupId === "string") {
                        if (StudyGroupMessageController.isValidStudyGroup(handshakeMessage.studyGroupId)) {
                            console.log("[HANDSHAKE OK]", {
                                userId: handshakeMessage.userId,
                                name: handshakeMessage.name,
                                studyGroupId: handshakeMessage.studyGroupId
                            });
                            this.registerUserConnection(socket, handshakeMessage.name, handshakeMessage.userId, handshakeMessage.studyGroupId);
                            socket.removeListener("message", handleHandshake);
                            return;
                        }
                        else {
                            console.warn("[HANDSHAKE FAILED - INVALID STUDY GROUP]", {
                                studyGroupId: handshakeMessage.studyGroupId,
                                raw: handshakeMessage
                            });
                            socket.close(1008, "INVALID_STUDY_GROUP");
                            socket.removeListener("message", handleHandshake);
                            return;
                        }
                    }
                    else {
                        console.warn("[HANDSHAKE FAILED - MALFORMED MESSAGE]", {
                            raw: handshakeMessage
                        });
                        socket.close(1003, "INVALID_MESSAGE_FORMAT");
                        socket.removeListener("message", handleHandshake);
                        return;
                    }
                }
                catch (err) {
                    console.warn("[HANDSHAKE FAILED - PARSE ERROR]", {
                        error: err instanceof Error ? err.message : err,
                        raw: data?.toString?.()
                    });
                    socket.close(1003, "INVALID_JSON");
                    socket.removeListener("message", handleHandshake);
                    return;
                }
            };
            socket.once("message", handleHandshake);
        });
    }
    /**
     * Returns the number of active connections in a study group.
     */
    getOnlineCount(studyGroupId) {
        return this.activeUserConnections.filter(c => c.studyGroupId === studyGroupId).length;
    }
    /**
     * Broadcasts a presence update to all members of a study group.
     */
    broadcastPresence(studyGroupId) {
        const onlineCount = this.getOnlineCount(studyGroupId);
        console.log(`[PRESENCE] Group <${studyGroupId}> now has ${onlineCount} online`);
        for (const connection of this.activeUserConnections) {
            if (connection.studyGroupId === studyGroupId) {
                connection.send({
                    type: "presence",
                    studyGroupId,
                    onlineCount,
                });
            }
        }
    }
    /**
     * Registers a connection as a user after they subscribe to a study group.
     * Sends message history to the new connection, then broadcasts updated presence.
     */
    registerUserConnection(socket, name, id, studyGroupId) {
        console.log(`User <${name}> (<${id}>) connected to study group <${studyGroupId}>.`);
        const userMessageConnection = new userMessageConnection_1.UserChatConnection(socket, name, id, studyGroupId, this);
        this.activeUserConnections.push(userMessageConnection);
        // Send history before presence so the UI populates in logical order
        this.sendHistoryToConnection(userMessageConnection, studyGroupId);
        // Notify everyone in the group (including the new user) of the updated count
        this.broadcastPresence(studyGroupId);
        socket.on("error", (err) => {
            console.error("[SOCKET ERROR - AFTER HANDSHAKE]", {
                name,
                id,
                studyGroupId,
                message: err.message,
                stack: err.stack
            });
        });
        socket.on("close", (code, reason) => {
            console.warn(`[USER DISCONNECTED]`, {
                name,
                id,
                studyGroupId,
                code,
                reason: reason.toString(),
                readyState: socket.readyState
            });
            const index = this.activeUserConnections.indexOf(userMessageConnection);
            if (index !== -1) {
                this.activeUserConnections.splice(index, 1);
            }
            // Broadcast updated presence after the connection is removed
            this.broadcastPresence(studyGroupId);
        });
    }
    /**
     * Sends the stored message history for a group to a single connection.
     */
    sendHistoryToConnection(connection, studyGroupId) {
        const history = this.messageHistory.get(studyGroupId) ?? [];
        if (history.length === 0)
            return;
        console.log(`[HISTORY] Sending ${history.length} messages to <${connection.name}> for group <${studyGroupId}>`);
        connection.send({
            type: "history",
            messages: history,
        });
    }
    /**
     * Appends a message to the group's history, capped at MAX_HISTORY entries.
     */
    appendToHistory(studyGroupId, message) {
        if (!this.messageHistory.has(studyGroupId)) {
            this.messageHistory.set(studyGroupId, []);
        }
        const history = this.messageHistory.get(studyGroupId);
        history.push(message);
        if (history.length > StudyGroupMessageController.MAX_HISTORY) {
            history.splice(0, history.length - StudyGroupMessageController.MAX_HISTORY);
        }
    }
    /**
     * Saves a message to history and broadcasts it to all users in the study group.
     */
    broadcastMessage(studyGroupId, sender, content) {
        console.log(`[BROADCAST] from <${sender.name}> in <${sender.studyGroupId}>`, {
            content
        });
        const storedMessage = {
            ...content,
            senderId: sender.userId,
            timestamp: Date.now(),
        };
        this.appendToHistory(studyGroupId, storedMessage);
        for (const connection of this.activeUserConnections) {
            if (connection.studyGroupId === studyGroupId) {
                connection.send(storedMessage);
            }
        }
    }
}
exports.StudyGroupMessageController = StudyGroupMessageController;
//# sourceMappingURL=studyGroupMessgeController.js.map