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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudyGroupMessageController } from "./studyGroupMessgeController";
import { UserChatConnection } from "./userMessageConnection";

// Mock WebSocket
class MockWebSocket {
  handlers: Record<string, Function[]> = {};
  readyState = 1;
  send = vi.fn();
  close = vi.fn();

  on(event: string, cb: Function) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(cb);
  }

  trigger(event: string, data?: any) {
    this.handlers[event]?.forEach(cb => cb(data));
  }
}

describe("StudyGroup System", () => {

  let controller: StudyGroupMessageController;

  beforeEach(() => {
    controller = new StudyGroupMessageController(0);
    controller.activeUserConnections = [];
  });

  // =============================================================================
  // handleMessage()
  // =============================================================================

  describe("handleMessage()", () => {

    it("H1 | valid chat → broadcast called", () => {
      const socket = new MockWebSocket();
      const mockBroadcast = vi.fn();

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        { broadcastMessage: mockBroadcast } as any
      );

      socket.trigger("message", JSON.stringify({
        type: "chat",
        content: "hello"
      }));

      expect(mockBroadcast).toHaveBeenCalled();
    });

    it("H2 | invalid JSON → throws INVALID_JSON", () => {
      const socket = new MockWebSocket();

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        controller
      );

      expect(() =>
        (conn as any).handleMessage("not json")
      ).toThrow("INVALID_JSON");
    });

    it("H3 | missing type → throws INVALID_MESSAGE", () => {
      const socket = new MockWebSocket();

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        controller
      );

      expect(() =>
        (conn as any).handleMessage(JSON.stringify({}))
      ).toThrow("INVALID_MESSAGE");
    });

    it("H4 | unknown type → throws UNKNOWN_MESSAGE_TYPE", () => {
      const socket = new MockWebSocket();

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        controller
      );

      expect(() =>
        (conn as any).handleMessage(JSON.stringify({ type: "weird" }))
      ).toThrow("UNKNOWN_MESSAGE_TYPE");
    });

    it("H5 | invalid content → throws INVALID_CHAT_CONTENT", () => {
      const socket = new MockWebSocket();

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        controller
      );

      expect(() =>
        (conn as any).handleMessage(JSON.stringify({ type: "chat", content: 123 }))
      ).toThrow("INVALID_CHAT_CONTENT");
    });

  });

  // =============================================================================
  // registerUserConnection()
  // =============================================================================

  describe("registerUserConnection()", () => {

    it("R1 | valid input → user added", () => {
      const socket = new MockWebSocket();

      controller.registerUserConnection(socket as any, "Omar", "1", "math");

      expect(controller.activeUserConnections.length).toBe(1);
    });

    it("R2 | invalid socket → throws INVALID_SOCKET", () => {
      expect(() =>
        controller.registerUserConnection(null as any, "Omar", "1", "math")
      ).toThrow("INVALID_SOCKET");
    });

    it("R3 | invalid user data → throws INVALID_USER_DATA", () => {
      const socket = new MockWebSocket();

      expect(() =>
        controller.registerUserConnection(socket as any, "", "", "math")
      ).toThrow("INVALID_USER_DATA");
    });

    it("R4 | invalid study group → throws INVALID_STUDY_GROUP", () => {
      const socket = new MockWebSocket();

      expect(() =>
        controller.registerUserConnection(socket as any, "Omar", "1", "history")
      ).toThrow("INVALID_STUDY_GROUP");
    });

  });

  // =============================================================================
  // send()
  // =============================================================================

  describe("send()", () => {

    it("S1 | socket open → sends message", () => {
      const socket = new MockWebSocket();

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        controller
      );

      conn.send({ hello: "world" });

      expect(socket.send).toHaveBeenCalled();
    });

    it("S2 | socket closed → throws SOCKET_NOT_OPEN", () => {
      const socket = new MockWebSocket();
      socket.readyState = 0;

      const conn = new UserChatConnection(
        socket as any,
        "Omar",
        "1",
        "math",
        controller
      );

      expect(() =>
        conn.send({ hello: "world" })
      ).toThrow("SOCKET_NOT_OPEN");
    });

  });

});