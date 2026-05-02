import { StudyGroupClient } from "./chatClient";
import { StudyGroupMessageController } from "./studyGroupMessgeController";

// Start server
const PORT = 9998;
new StudyGroupMessageController(PORT);

console.log(`Server running on ws://localhost:${PORT}`);

/** 
// Small delay to ensure server is up before clients connect
setTimeout(() => {
    // Create clients
    const client1 = new StudyGroupClient(
        `ws://localhost:${PORT}`,
        "1",
        "Alice",
        "math"
    );

    const client2 = new StudyGroupClient(
        `ws://localhost:${PORT}`,
        "2",
        "Bob",
        "math"
    );

    const client3 = new StudyGroupClient(
        `ws://localhost:${PORT}`,
        "3",
        "Charlie",
        "science"
    );

    // Send messages after connection
    setTimeout(() => {
        client1.sendChat("Hello from Alice");
        client2.sendChat("Hey Alice!");
        client3.sendChat("Science");
    }, 1000);

    // Optional: disconnect after a bit
    ///setTimeout(() => {
        ///client1.disconnect();
        ///client2.disconnect();
        ///client3.disconnect();
    ///}, 5000);

}, 500);
*/