import WebSocket from "ws";
import { StudyGroupMessageController } from "./studyGroupMessgeController";

export class UserChatConnection
{
    private socket: WebSocket;
    private studyGroupMessageController: StudyGroupMessageController;
    
    studyGroupId: string;
    name: string;
    userId: string;

    constructor(socket: WebSocket, name: string, id: string, studyGroupId: string, studyGroupMessageController: StudyGroupMessageController)
    {
        this.socket = socket;
        this.name = name;
        this.userId = id;   
        this.studyGroupId = studyGroupId;
        this.studyGroupMessageController = studyGroupMessageController;

        this.socket.on("message", (data) =>
        {
            this.handleMessage(data.toString());
        });

        this.socket.on("close", () =>
        {
            this.onDisconnect();
        });

        this.socket.on("error", (err) =>
        {
            console.error("Socket error:", err);
        });
    }

    private handleMessage(raw: string)
    {
        let message: any;

        try
        {
            message = JSON.parse(raw);
        }
        catch
        {
            console.warn("Invalid JSON received:", raw);
            return;
        }

        switch (message.type)
        {
            case "chat":
                if (typeof message.content !== "string") {
                    throw new Error("INVALID_CHAT_CONTENT");
                }

                this.studyGroupMessageController.broadcastMessage(
                    this.studyGroupId,
                    this,
                    {
                        type: "chat",
                        content: message.content,
                        sender: this.name,
                        studyGroupId: this.studyGroupId
                    }
                );
                break;

            default:
                throw new Error("UNKNOWN_MESSAGE_TYPE");
        }
    }

    public send(data: any)
    {

        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("SOCKET_NOT_OPEN");
        }
        
        if (this.socket.readyState === WebSocket.OPEN)
        {
            this.socket.send(JSON.stringify(data));
        }
    }

    private onDisconnect()
    {
        console.log("User disconnected", this.studyGroupId);
    }
}