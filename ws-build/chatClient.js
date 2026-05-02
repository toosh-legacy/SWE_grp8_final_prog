"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyGroupClient = void 0;
class StudyGroupClient {
    socket;
    url;
    userId;
    name;
    studyGroupId;
    isConnected = false;
    constructor(url, userId, name, studyGroupId) {
        this.url = url;
        this.userId = userId;
        this.name = name;
        this.studyGroupId = studyGroupId;
        this.socket = new WebSocket(this.url);
        this.registerEvents();
    }
    registerEvents() {
        this.socket.onopen = () => {
            this.isConnected = true;
            console.log("Connected to server.");
            this.sendJoinMessage();
        };
        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        this.socket.onclose = () => {
            this.isConnected = false;
            console.log("Disconnected from server.");
        };
        this.socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };
    }
    sendJoinMessage() {
        const joinMessage = {
            userId: this.userId,
            name: this.name,
            studyGroupId: this.studyGroupId,
        };
        this.socket.send(JSON.stringify(joinMessage));
    }
    handleMessage(data) {
        let message;
        try {
            message = JSON.parse(data);
        }
        catch {
            console.warn("Received invalid JSON:", data);
            return;
        }
        // Server broadcasts raw message back
        if (message.type === "chat") {
            console.log(`[${message.studyGroupId}] ${message.sender ?? "unknown"}: ${message.content}`);
        }
        else {
            console.log("Received:", message);
        }
    }
    sendChat(content) {
        if (!this.isConnected)
            return;
        const message = {
            type: "chat",
            content,
        };
        this.socket.send(JSON.stringify(message));
    }
    disconnect() {
        this.socket.close();
    }
}
exports.StudyGroupClient = StudyGroupClient;
//# sourceMappingURL=chatClient.js.map