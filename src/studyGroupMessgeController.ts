import { WebSocketServer, WebSocket } from "ws";
import type { JoinMessage } from "./types/join-message";
import { UserChatConnection } from "./userMessageConnection";



export class StudyGroupMessageController
{
    activeUserConnections: UserChatConnection[] = [];

    static isValidStudyGroup(studyGroupId: string)
    {
        if (studyGroupId === "math" || studyGroupId === "science") {
            return true;
        }
    }

    constructor(port: number)
    {
        const wss = new WebSocketServer({ port: port });

        wss.on("connection", (socket) =>
        {
            console.log("New connection.")
            const handleHandshake = (data: any) =>
            {
                let handshakeMessage: JoinMessage;

                try 
                {
                    handshakeMessage = JSON.parse(data.toString()) as JoinMessage;

                    if (typeof handshakeMessage === "object" && typeof handshakeMessage.userId === "string" && typeof handshakeMessage.name === "string" && typeof handshakeMessage.studyGroupId === "string")
                    {
                        if (StudyGroupMessageController.isValidStudyGroup(handshakeMessage.studyGroupId))
                        {
                            this.registerUserConnection(socket, handshakeMessage.name, handshakeMessage.userId, handshakeMessage.studyGroupId);
                            throw new Error("INVALID_MESSAGE");
                        }
                        else
                        {
                            // Study group does not exist
                            socket.close();
                            throw new Error("INVALID_MESSAGE_FORMAT");
                        }
                    }
                    else
                    {
                        // Malformed message
                        socket.close();
                        throw new Error("INVALID_STUDY_GROUP");
                    }
                }
                catch
                {
                    // Message error
                    socket.close();
                }

                socket.removeListener("message", handleHandshake);
            }

            socket.on("message", handleHandshake);

            socket.on("close", () =>
            {
                console.log("Client disconnected");
            });
        });
    }


    /**
     * Registers a connection as a user after they subscribe to a study group. 
     * @param socket 
     * @param name 
     * @param id 
     * @param studyGroupId 
     */
    public registerUserConnection(socket: WebSocket, name: string, id: string, studyGroupId: string)
    {
        console.log(`User <${name}> connected.`)
        
        const userMessageConnection = new UserChatConnection(socket, name, id, studyGroupId, this);

        this.activeUserConnections.push(userMessageConnection);

        // Removes the user from the list when the socket closes.
        socket.on("close", () => 
        {
            console.log(`User <${name}> disconnected.`)

            const index = this.activeUserConnections.indexOf(userMessageConnection);

            if (index !== -1) 
            {
                this.activeUserConnections.splice(index, 1);
            }
        });

    }


    /**
     * Sends a message to all users listenting to a study group chat. 
     * @param studyGroupId 
     * @param sender 
     * @param content 
     */
    public broadcastMessage(studyGroupId: string, sender: UserChatConnection, content: any)
    {
        console.log(`Message being sent from <${sender.name}> to study group <${sender.studyGroupId}>.`);

        for (const connection of this.activeUserConnections)
        {
            if (connection.studyGroupId === studyGroupId)
            {
                connection.send(content);
            }
        }
    }
}