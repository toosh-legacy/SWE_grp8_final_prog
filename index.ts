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
export type FeedCategory = 'general' | 'announcement' | 'events';

export const VALID_FEED_CATEGORIES: FeedCategory[] = [
  'general',
  'announcement',
  'events',
];

// ─── Comment (Domain Model: Comment class) ────────────────────────────────────
export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;       // ADDED
  authorPFP: string | null; // ADDED
  content: string;
  createdAt: string;
}

// ─── Post & Metadata ──────────────────────────────────────────────────────────
export interface PostMetadata {
  title?: string;
  location?: string;
  eventDate?: string;
  maxAttendees?: number | null;
}

export interface Post {
  postId: string;
  authorId: string;
  authorName: string;
  authorPFP: string | null;
  content: string;
  mediaUrl: string | null;
  type: FeedCategory;
  createdAt: string;      
  likeCount?: number;       // From withLikeSummaries
  likedByMe?: boolean;      // From withLikeSummaries
  metadata?: PostMetadata;  // From JSONB
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
  /** Optional body text; stored in `events.description` when the column exists. */
  description?: string;
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

export interface PostMetadata {
  title?: string;
  location?: string;
  eventDate?: string;
  maxAttendees?: number | null;
}

// Add metadata to your existing Post interface
export interface Post {
  postId: string;
  authorId: string;
  authorName: string;
  authorPFP: string | null;
  content: string;
  mediaUrl: string | null;
  type: FeedCategory;
  createdAt: string;
  metadata?: PostMetadata; // <--- ADD THIS
}
