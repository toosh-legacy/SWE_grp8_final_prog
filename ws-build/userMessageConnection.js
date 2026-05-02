"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserChatConnection = void 0;
const ws_1 = __importDefault(require("ws"));
class UserChatConnection {
    socket;
    studyGroupMessageController;
    studyGroupId;
    name;
    userId;
    constructor(socket, name, id, studyGroupId, studyGroupMessageController) {
        this.socket = socket;
        this.name = name;
        this.userId = id;
        this.studyGroupId = studyGroupId;
        this.studyGroupMessageController = studyGroupMessageController;
        this.socket.on("message", (data) => {
            this.handleMessage(data.toString());
        });
        this.socket.on("close", () => {
            this.onDisconnect();
        });
        this.socket.on("error", (err) => {
            console.error("Socket error:", err);
        });
    }
    handleMessage(raw) {
        let message;
        try {
            message = JSON.parse(raw);
        }
        catch {
            console.warn("Invalid JSON received:", raw);
            return;
        }
        switch (message.type) {
            case "chat":
                if (typeof message.content !== "string") {
                    throw new Error("INVALID_CHAT_CONTENT");
                }
                this.studyGroupMessageController.broadcastMessage(this.studyGroupId, this, {
                    type: "chat",
                    content: message.content,
                    sender: this.name,
                    // senderId is added by broadcastMessage via the sender reference
                    studyGroupId: this.studyGroupId,
                });
                break;
            default:
                throw new Error("UNKNOWN_MESSAGE_TYPE");
        }
    }
    send(data) {
        if (this.socket.readyState !== ws_1.default.OPEN) {
            throw new Error("SOCKET_NOT_OPEN");
        }
        this.socket.send(JSON.stringify(data));
    }
    onDisconnect() {
        console.log("User disconnected", this.studyGroupId);
    }
}
exports.UserChatConnection = UserChatConnection;
//# sourceMappingURL=userMessageConnection.js.map