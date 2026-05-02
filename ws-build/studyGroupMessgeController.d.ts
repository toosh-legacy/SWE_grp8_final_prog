import { WebSocket } from "ws";
import { UserChatConnection } from "./userMessageConnection";
export declare class StudyGroupMessageController {
    activeUserConnections: UserChatConnection[];
    /** Per-group message history. Key = studyGroupId. */
    private messageHistory;
    /** Maximum messages to retain per group. */
    private static readonly MAX_HISTORY;
    static isValidStudyGroup(studyGroupId: string): boolean;
    constructor(port: number);
    /**
     * Returns the number of active connections in a study group.
     */
    private getOnlineCount;
    /**
     * Broadcasts a presence update to all members of a study group.
     */
    private broadcastPresence;
    /**
     * Registers a connection as a user after they subscribe to a study group.
     * Sends message history to the new connection, then broadcasts updated presence.
     */
    registerUserConnection(socket: WebSocket, name: string, id: string, studyGroupId: string): void;
    /**
     * Sends the stored message history for a group to a single connection.
     */
    private sendHistoryToConnection;
    /**
     * Appends a message to the group's history, capped at MAX_HISTORY entries.
     */
    private appendToHistory;
    /**
     * Saves a message to history and broadcasts it to all users in the study group.
     */
    broadcastMessage(studyGroupId: string, sender: UserChatConnection, content: any): void;
}
//# sourceMappingURL=studyGroupMessgeController.d.ts.map