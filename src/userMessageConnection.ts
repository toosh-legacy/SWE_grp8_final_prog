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

        this.registerEvents();
    }

    private registerEvents()
    {
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
                this.studyGroupMessageController.broadcastMessage(this.studyGroupId, this, message);
                break;

            default:
                console.warn("Unknown message type:", message.type);
        }
    }

    public send(data: any)
    {
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