import type { JoinMessage } from "./types/join-message";

type ChatMessage = {
    type: "chat";
    content: string;
};

type IncomingMessage = any;

export class StudyGroupClient 
{
    private socket: WebSocket;
    private url: string;

    private userId: string;
    private name: string;
    private studyGroupId: string;

    private isConnected = false;

    constructor(url: string, userId: string, name: string, studyGroupId: string) 
    {
        this.url = url;
        this.userId = userId;
        this.name = name;
        this.studyGroupId = studyGroupId;

        this.socket = new WebSocket(this.url);

        this.registerEvents();
    }

    private registerEvents() {
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

    private sendJoinMessage() {
        const joinMessage: JoinMessage = {
            userId: this.userId,
            name: this.name,
            studyGroupId: this.studyGroupId,
        };

        this.socket.send(JSON.stringify(joinMessage));
    }

    private handleMessage(data: any) {
        let message: IncomingMessage;

        try {
            message = JSON.parse(data);
        } catch {
            console.warn("Received invalid JSON:", data);
            return;
        }

        // Server broadcasts raw message back
        if (message.type === "chat") {
            console.log(`[${message.studyGroupId}] ${message.sender ?? "unknown"}: ${message.content}`);
        } else {
            console.log("Received:", message);
        }
    }

    public sendChat(content: string) {
        if (!this.isConnected) return;

        const message: ChatMessage = {
            type: "chat",
            content,
        };

        this.socket.send(JSON.stringify(message));
    }

    public disconnect() {
        this.socket.close();
    }
}