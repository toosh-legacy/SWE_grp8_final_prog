/**
 * index.ts — Campus Connect
 * Shared TypeScript interfaces derived from the Design Class Diagram (DCD).
 * All attribute names and types match the DCD exactly.
 */

// ─── Student (DCD: Student class / Auth subsystem) ────────────────────────────
export interface Student {
  studentId: string;
  name: string;
  email: string;
  campus: string;
  major: string;
  bio: string;
  avatarUrl: string;
  passwordHash: string;
}

// ─── Feed Category (FR8a) ──────────────────────────────────────────────────────
export type FeedCategory = 'general' | 'announcement' | 'event';

export const VALID_FEED_CATEGORIES: FeedCategory[] = [
  'general',
  'announcement',
  'event',
];

// ─── Post (DCD: Post class) ────────────────────────────────────────────────────
export interface Post {
  postId: string;
  authorId: string;
  content: string;        // max 250 chars (FR8)
  mediaUrl: string | null;
  type: FeedCategory;
  createdAt: string;      // ISO 8601 DateTime
}

// ─── Comment (Domain Model: Comment class) ────────────────────────────────────
export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// ─── Event (DCD: Event class) ──────────────────────────────────────────────────
export interface CampusEvent {
  eventId: string;
  organizerId: string;
  title: string;
  location: string;
  startTime: string;      // ISO 8601 DateTime
  capacity: number;       // positive integer
  isCancelled: boolean;
  cancelReason?: string;
}

// ─── Authentication Session (DCD: Authentication class) ───────────────────────
export interface AuthSession {
  studentId: string;
  provider: string;
  accessToken: string;
  tokenExpiry: string;
}

// ─── Connection (DCD: Connection class) ───────────────────────────────────────
export interface Connection {
  connectionId: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
