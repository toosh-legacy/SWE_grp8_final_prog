"use strict";
/**
 * studyGroup.test.ts — Study Group Messaging System
 *
 * Testing Framework : Vitest
 * Modules Under Test :
 *   - StudyGroupMessageController
 *   - UserChatConnection
 *
 * Covers:
 *   isValidStudyGroup(studyGroupId)
 *   registerUserConnection(socket, name, id, studyGroupId)
 *   broadcastMessage(studyGroupId, sender, content)
 *   handleMessage(raw)
 *   send(data)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 1 — INPUT VALUE ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Method: handleMessage(raw: String)
 * ┌──────────────┬─────────┬────────────────────────────┬──────────────────────────┬────────────────────┐
 * │ Variable     │ Type    │ Valid                      │ Invalid                  │ Exceptional        │
 * ├──────────────┼─────────┼────────────────────────────┼──────────────────────────┼────────────────────┤
 * │ raw          │ String  │ valid JSON string          │ "not json"               │ null, undefined    │
 * │ type         │ String  │ "chat"                     │ "unknown"                │ missing            │
 * │ content      │ String  │ "hello"                    │ number/object            │ null               │
 * └──────────────┴─────────┴────────────────────────────┴──────────────────────────┴────────────────────┘
 *
 * Method: registerUserConnection(...)
 * ┌──────────────┬─────────┬────────────────────────────┬──────────────────────────┬────────────────────┐
 * │ Variable     │ Type    │ Valid                      │ Invalid                  │ Exceptional        │
 * ├──────────────┼─────────┼────────────────────────────┼──────────────────────────┼────────────────────┤
 * │ socket       │ Object  │ valid WS                   │ closed socket            │ null               │
 * │ name         │ String  │ "Omar"                     │ ""                       │ null               │
 * │ id           │ String  │ "123"                      │ ""                       │ null               │
 * │ studyGroupId │ String  │ "math","science"           │ "history"                │ null               │
 * └──────────────┴─────────┴────────────────────────────┴──────────────────────────┴────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 2 — TEST CASE SCENARIOS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * handleMessage()
 * ┌──────┬──────────────────────────────┬──────────────────────────────┐
 * │ TC # │ Scenario                     │ Expected Output              │
 * ├──────┼──────────────────────────────┼──────────────────────────────┤
 * │ H1   │ valid chat                   │ broadcast called             │
 * │ H2   │ invalid JSON                 │ throws INVALID_JSON          │
 * │ H3   │ missing type                 │ throws INVALID_MESSAGE       │
 * │ H4   │ unknown type                 │ throws UNKNOWN_MESSAGE_TYPE  │
 * │ H5   │ invalid content              │ throws INVALID_CHAT_CONTENT  │
 * └──────┴──────────────────────────────┴──────────────────────────────┘
 *
 * registerUserConnection()
 * ┌──────┬──────────────────────────────┬──────────────────────────────┐
 * │ TC # │ Scenario                     │ Expected Output              │
 * ├──────┼──────────────────────────────┼──────────────────────────────┤
 * │ R1   │ valid input                  │ user added                   │
 * │ R2   │ invalid socket               │ throws INVALID_SOCKET        │
 * │ R3   │ invalid user data            │ throws INVALID_USER_DATA     │
 * │ R4   │ invalid study group          │ throws INVALID_STUDY_GROUP   │
 * └──────┴──────────────────────────────┴──────────────────────────────┘
 *
 * send()
 * ┌──────┬──────────────────────────────┬──────────────────────────────┐
 * │ TC # │ Scenario                     │ Expected Output              │
 * ├──────┼──────────────────────────────┼──────────────────────────────┤
 * │ S1   │ socket open                  │ message sent                 │
 * │ S2   │ socket closed                │ throws SOCKET_NOT_OPEN       │
 * └──────┴──────────────────────────────┴──────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 3 — CONCRETE TEST CASE VALUES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * handleMessage()
 * ┌──────┬──────────────────────────────────────────┬──────────────────────────┐
 * │ TC # │ Input                                    │ Expected Output          │
 * ├──────┼──────────────────────────────────────────┼──────────────────────────┤
 * │ H1   │ {"type":"chat","content":"hello"}         │ broadcast called         │
 * │ H2   │ "not json"                               │ INVALID_JSON             │
 * │ H3   │ {}                                       │ INVALID_MESSAGE          │
 * │ H4   │ {"type":"weird"}                         │ UNKNOWN_MESSAGE_TYPE     │
 * │ H5   │ {"type":"chat","content":123}            │ INVALID_CHAT_CONTENT     │
 * └──────┴──────────────────────────────────────────┴──────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const studyGroupMessgeController_1 = require("./studyGroupMessgeController");
const userMessageConnection_1 = require("./userMessageConnection");
// Mock WebSocket
class MockWebSocket {
    handlers = {};
    readyState = 1;
    send = vitest_1.vi.fn();
    close = vitest_1.vi.fn();
    on(event, cb) {
        if (!this.handlers[event])
            this.handlers[event] = [];
        this.handlers[event].push(cb);
    }
    trigger(event, data) {
        this.handlers[event]?.forEach(cb => cb(data));
    }
}
(0, vitest_1.describe)("StudyGroup System", () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        controller = new studyGroupMessgeController_1.StudyGroupMessageController(0);
        controller.activeUserConnections = [];
    });
    // =============================================================================
    // handleMessage()
    // =============================================================================
    (0, vitest_1.describe)("handleMessage()", () => {
        (0, vitest_1.it)("H1 | valid chat → broadcast called", () => {
            const socket = new MockWebSocket();
            const mockBroadcast = vitest_1.vi.fn();
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", { broadcastMessage: mockBroadcast });
            socket.trigger("message", JSON.stringify({
                type: "chat",
                content: "hello"
            }));
            (0, vitest_1.expect)(mockBroadcast).toHaveBeenCalled();
        });
        (0, vitest_1.it)("H2 | invalid JSON → throws INVALID_JSON", () => {
            const socket = new MockWebSocket();
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", controller);
            (0, vitest_1.expect)(() => conn.handleMessage("not json")).toThrow("INVALID_JSON");
        });
        (0, vitest_1.it)("H3 | missing type → throws INVALID_MESSAGE", () => {
            const socket = new MockWebSocket();
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", controller);
            (0, vitest_1.expect)(() => conn.handleMessage(JSON.stringify({}))).toThrow("INVALID_MESSAGE");
        });
        (0, vitest_1.it)("H4 | unknown type → throws UNKNOWN_MESSAGE_TYPE", () => {
            const socket = new MockWebSocket();
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", controller);
            (0, vitest_1.expect)(() => conn.handleMessage(JSON.stringify({ type: "weird" }))).toThrow("UNKNOWN_MESSAGE_TYPE");
        });
        (0, vitest_1.it)("H5 | invalid content → throws INVALID_CHAT_CONTENT", () => {
            const socket = new MockWebSocket();
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", controller);
            (0, vitest_1.expect)(() => conn.handleMessage(JSON.stringify({ type: "chat", content: 123 }))).toThrow("INVALID_CHAT_CONTENT");
        });
    });
    // =============================================================================
    // registerUserConnection()
    // =============================================================================
    (0, vitest_1.describe)("registerUserConnection()", () => {
        (0, vitest_1.it)("R1 | valid input → user added", () => {
            const socket = new MockWebSocket();
            controller.registerUserConnection(socket, "Omar", "1", "math");
            (0, vitest_1.expect)(controller.activeUserConnections.length).toBe(1);
        });
        (0, vitest_1.it)("R2 | invalid socket → throws INVALID_SOCKET", () => {
            (0, vitest_1.expect)(() => controller.registerUserConnection(null, "Omar", "1", "math")).toThrow("INVALID_SOCKET");
        });
        (0, vitest_1.it)("R3 | invalid user data → throws INVALID_USER_DATA", () => {
            const socket = new MockWebSocket();
            (0, vitest_1.expect)(() => controller.registerUserConnection(socket, "", "", "math")).toThrow("INVALID_USER_DATA");
        });
        (0, vitest_1.it)("R4 | invalid study group → throws INVALID_STUDY_GROUP", () => {
            const socket = new MockWebSocket();
            (0, vitest_1.expect)(() => controller.registerUserConnection(socket, "Omar", "1", "history")).toThrow("INVALID_STUDY_GROUP");
        });
    });
    // =============================================================================
    // send()
    // =============================================================================
    (0, vitest_1.describe)("send()", () => {
        (0, vitest_1.it)("S1 | socket open → sends message", () => {
            const socket = new MockWebSocket();
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", controller);
            conn.send({ hello: "world" });
            (0, vitest_1.expect)(socket.send).toHaveBeenCalled();
        });
        (0, vitest_1.it)("S2 | socket closed → throws SOCKET_NOT_OPEN", () => {
            const socket = new MockWebSocket();
            socket.readyState = 0;
            const conn = new userMessageConnection_1.UserChatConnection(socket, "Omar", "1", "math", controller);
            (0, vitest_1.expect)(() => conn.send({ hello: "world" })).toThrow("SOCKET_NOT_OPEN");
        });
    });
});
//# sourceMappingURL=studyGroup.test.js.map