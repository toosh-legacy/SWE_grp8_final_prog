import { StudyGroupClient } from "./chatClient";
import { StudyGroupMessageController } from "./studyGroupMessgeController";

const PORT = 9999;

const server = new StudyGroupMessageController(PORT);

const testClient1 = new StudyGroupClient("ws://localhost:9999", "0", "Bob", "math");
const testClient2 = new StudyGroupClient("ws://localhost:9999", "1", "Joe", "math");
const testClient3 = new StudyGroupClient("ws://localhost:9999", "2", "Don", "math");


