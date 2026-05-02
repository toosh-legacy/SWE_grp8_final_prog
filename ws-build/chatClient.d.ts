export declare class StudyGroupClient {
    private socket;
    private url;
    private userId;
    private name;
    private studyGroupId;
    private isConnected;
    constructor(url: string, userId: string, name: string, studyGroupId: string);
    private registerEvents;
    private sendJoinMessage;
    private handleMessage;
    sendChat(content: string): void;
    disconnect(): void;
}
//# sourceMappingURL=chatClient.d.ts.map