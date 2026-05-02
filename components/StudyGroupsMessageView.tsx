import { useEffect, useRef, useState } from "react";
import { StudyGroupClient } from "@/lib/StudyGroupClient";

// ─────────────────────────────────────────────────────────────────────────────

interface GroupInfo {
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  onlineCount: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPfp: string | null;
  content: string;
  time: string;
}

// ─────────────────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  url: string | null;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ name, url, size = 38 }: AvatarProps) {
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    border: "2px solid rgb(255 255 255 / 0.18)",
    overflow: "hidden",
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ ...baseStyle, display: "block", objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        background: "#4a4a4a",
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#ffffff",
        letterSpacing: "0.02em",
        userSelect: "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ChatHeaderProps {
  group: GroupInfo;
  onlineCount: number;
}

function ChatHeader({ group, onlineCount }: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <Avatar name={group.name} url={group.avatarUrl} size={44} />
      <div className="chat-header__info">
        <span className="chat-header__name">{group.name}</span>
        <span className="chat-header__meta">
          <span className="chat-header__members">{group.memberCount} members</span>
          <span className="chat-header__dot" aria-hidden="true">·</span>
          <span className="chat-header__online">
            <span className="chat-header__online-dot" aria-hidden="true" />
            {onlineCount} online
          </span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface InboundMessageProps {
  content: string;
  time: string;
  senderName: string;
  senderPfp: string | null;
}

function InboundMessage({ content, time, senderName, senderPfp }: InboundMessageProps) {
  return (
    <div className="msg msg--inbound">
      <Avatar name={senderName} url={senderPfp} size={34} />
      <div className="msg__body">
        <div className="msg__meta">
          <span className="msg__sender">{senderName}</span>
          <span className="msg__time">{time}</span>
        </div>
        <div className="msg__bubble msg__bubble--inbound">{content}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface OutboundMessageProps {
  content: string;
  time: string;
}

function OutboundMessage({ content, time }: OutboundMessageProps) {
  return (
    <div className="msg msg--outbound">
      <div className="msg__body msg__body--outbound">
        <div className="msg__time msg__time--outbound">{time}</div>
        <div className="msg__bubble msg__bubble--outbound">{content}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ComposeBarProps {
  onSend: (content: string) => void;
}

function ComposeBar({ onSend }: ComposeBarProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="compose-bar">
      <input
        className="compose-bar__input"
        type="text"
        placeholder="Send a message…"
        aria-label="Message input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="compose-bar__send btn"
        aria-label="Send message"
        onClick={handleSend}
        disabled={!value.trim()}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────

type StudyGroupsMessageViewProps = {
  userId: string;
  name: string;
  url: string;
  studyGroupId: string;
  group: GroupInfo;
};

export default function StudyGroupsMessageView(props: StudyGroupsMessageViewProps) {
  const { userId, name, url, studyGroupId, group } = props;

  const [messages, setMessages] = useState<Message[]>([]);
  // Seed with the prop value so there's no flash of "0 online" before the
  // first presence message arrives from the server.
  const [onlineCount, setOnlineCount] = useState(group.onlineCount);
  const clientRef = useRef<StudyGroupClient | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const client = new StudyGroupClient(url, userId, name, studyGroupId);

    client.onChat = (isSelf, senderName, content, timestamp) => {
      const date = timestamp ? new Date(timestamp) : new Date();
      const msg: Message = {
        id: crypto.randomUUID(),
        senderId: isSelf ? userId : senderName,
        senderName,
        senderPfp: null,
        content,
        time: formatTime(date),
      };
      setMessages((prev) => [...prev, msg]);
    };

    client.onPresence = (count) => {
      setOnlineCount(count);
    };

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [url, userId, name, studyGroupId]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(content: string) {
    clientRef.current?.sendChat(content);
  }

  return (
    <div className="chat-view">
      <ChatHeader group={group} onlineCount={onlineCount} />

      <div
        ref={feedRef}
        className="chat-feed"
        role="log"
        aria-live="polite"
        aria-label="Group messages"
      >
        {messages.map((msg) =>
          msg.senderId === userId ? (
            <OutboundMessage key={msg.id} content={msg.content} time={msg.time} />
          ) : (
            <InboundMessage
              key={msg.id}
              content={msg.content}
              time={msg.time}
              senderName={msg.senderName}
              senderPfp={msg.senderPfp}
            />
          )
        )}
      </div>

      <ComposeBar onSend={handleSend} />
    </div>
  );
}