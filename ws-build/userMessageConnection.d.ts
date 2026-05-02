import WebSocket from "ws";
import { StudyGroupMessageController } from "./studyGroupMessgeController";
export declare class UserChatConnection {
    private socket;
    private studyGroupMessageController;
    studyGroupId: string;
    name: string;
    userId: string;
    constructor(socket: WebSocket, name: string, id: string, studyGroupId: string, studyGroupMessageController: StudyGroupMessageController);
    private handleMessage;
    send(data: any): void;
    private onDisconnect;
}
//# sourceMappingURL=userMessageConnection.d.ts.map