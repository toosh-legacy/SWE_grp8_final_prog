import type { JoinMessage } from "./types/join-message";

type ChatMessage = {
    type: "chat";
    content: string;
};

type IncomingMessage = any;

export class StudyGroupClient {
    private socket: WebSocket | null = null;
    private url: string;

    private userId: string;
    private name: string;
    private studyGroupId: string;

    private isConnected = false;

    onChat: ((isSelf: boolean, senderName: string, content: string, timestamp?: number) => void) | undefined = undefined;
    onPresence: ((onlineCount: number) => void) | undefined = undefined;

    constructor(url: string, userId: string, name: string, studyGroupId: string) {
        this.url = url;
        this.userId = userId;
        this.name = name;
        this.studyGroupId = studyGroupId;
    }

    public connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

        this.socket = new WebSocket(this.url);
        this.registerEvents();
    }

    private registerEvents() {
        if (!this.socket) return;

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
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const joinMessage: JoinMessage = {
            userId: this.userId,
            name: this.name,
            studyGroupId: this.studyGroupId,
        };

        this.socket.send(JSON.stringify(joinMessage));
    }

    private handleMessage(data: string) {
        let message: IncomingMessage;

        try {
            message = JSON.parse(data);
        } catch {
            console.warn("Received invalid JSON:", data);
            return;
        }

        if (message.type === "history") {
            const messages: any[] = Array.isArray(message.messages) ? message.messages : [];

            console.log(`[HISTORY] Replaying ${messages.length} messages for group ${this.studyGroupId}`);

            for (const msg of messages) {
                const senderName = msg.sender ?? "unknown";
                const content = msg.content ?? "";
                const timestamp: number | undefined = typeof msg.timestamp === "number" ? msg.timestamp : undefined;

                const isSelf = msg.senderId
                    ? msg.senderId === this.userId
                    : senderName === this.name;

                if (this.onChat) {
                    this.onChat(isSelf, senderName, content, timestamp);
                }
            }
        } else if (message.type === "chat") {
            const senderName = message.sender ?? "unknown";
            const content = message.content ?? "";
            const timestamp: number | undefined = typeof message.timestamp === "number" ? message.timestamp : undefined;

            const isSelf = message.senderId
                ? message.senderId === this.userId
                : senderName === this.name;

            console.log(`[${message.studyGroupId}] ${senderName}: ${content}`);

            if (this.onChat) {
                this.onChat(isSelf, senderName, content, timestamp);
            }
        } else if (message.type === "presence") {
            console.log(`[PRESENCE] Group ${message.studyGroupId} — ${message.onlineCount} online`);

            if (this.onPresence) {
                this.onPresence(message.onlineCount as number);
            }
        } else {
            console.log("Received:", message);
        }
    }

    public sendChat(content: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const message: ChatMessage = {
            type: "chat",
            content,
        };

        this.socket.send(JSON.stringify(message));
    }

    public disconnect() {
        this.socket?.close();
        this.socket = null;
        this.isConnected = false;
    }
}