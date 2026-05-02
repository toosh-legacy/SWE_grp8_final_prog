/**
 * postService.ts — Campus Connect
 * COMPLETE FILE — All exports included.
 */

import { supabase } from './supabaseClient';
import type { Post, Comment, FeedCategory } from './index';
import { VALID_FEED_CATEGORIES } from './index';

// ─── Constants ─────────────────────────────────────────────────────────────────
export const MAX_POST_LENGTH = 250;

/** Max length for comments on posts (matches DB check in `comments_table.sql`). */
export const MAX_COMMENT_LENGTH = 500;

// ─── Validation Helpers (exported for testing) ────────────────────────────────

export function isValidContent(content: string | null | undefined): boolean {
  if (content === null || content === undefined) return false;
  return String(content).trim().length > 0;
}

export function isWithinPostLimit(content: string): boolean {
  return String(content).trim().length <= MAX_POST_LENGTH;
}

export function isWithinCommentLimit(content: string): boolean {
  return String(content).trim().length <= MAX_COMMENT_LENGTH;
}

export function isValidCategory(type: string | null | undefined): type is FeedCategory {
  if (!type) return false;
  return (VALID_FEED_CATEGORIES as string[]).includes(type);
}

// ─── createPost ──────────────────────────────────────────────────────────────

/**
 * Pre-condition : authorId references an authenticated user; content is non-empty and ≤ 250 chars;
 *                 type is a valid FeedCategory.
 * Post-condition: Row inserted into `posts` with `section` and optional `metadata` (e.g. event details).
 */
export async function createPost(
  authorId: string,
  content: string,
  type: FeedCategory,
  metadata?: Record<string, unknown>
): Promise<Post> {
  if (!authorId || String(authorId).trim() === '') {
    throw new Error('INVALID_AUTHOR: authorId is required.');
  }
  if (!isValidContent(content)) {
    throw new Error('INVALID_CONTENT: Post content cannot be empty.');
  }
  if (!isWithinPostLimit(content)) {
    throw new Error(
      `CONTENT_TOO_LONG: Post must be ${MAX_POST_LENGTH} characters or fewer.`
    );
  }
  if (!isValidCategory(type)) {
    throw new Error('INVALID_TYPE');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: authorId,
      section: type,
      content: content.trim(),
      metadata: metadata ?? {},
    })
    .select('*, author:profiles!author(username, avatar_url)')
    .single();

  if (error) throw new Error(`CREATE_POST_ERROR: ${error.message}`);
  return mapToPost(data);
}

// ─── editPost ────────────────────────────────────────────────────────────────

export async function editPost(
  postId: string,
  authorId: string,
  newContent: string
): Promise<boolean> {
  if (!isValidContent(newContent)) throw new Error('INVALID_CONTENT');
  if (!isWithinPostLimit(newContent)) throw new Error('CONTENT_TOO_LONG');

  const { error } = await supabase
    .from('posts')
    .update({ content: newContent.trim() })
    .eq('id', postId)
    .eq('user_id', authorId); // Ensure requester owns the post

  if (error) throw new Error(`EDIT_POST_ERROR: ${error.message}`);
  return true;
}

// ─── deletePost ──────────────────────────────────────────────────────────────

export async function deletePost(postId: string, authorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', authorId);

  if (error) throw new Error(`DELETE_POST_ERROR: ${error.message}`);
  return true;
}

// ─── likePost (toggle) ─────────────────────────────────────────────────────────

/**
 * Toggles the viewer's like on a post: adds a like if absent, removes it if present.
 * @returns `true` if the post is liked after this call, `false` if the like was removed.
 */
export async function likePost(postId: string, studentId: string): Promise<boolean> {
  if (!postId || String(postId).trim() === '') {
    throw new Error('INVALID_POST_ID: postId is required.');
  }
  if (!studentId || String(studentId).trim() === '') {
    throw new Error('INVALID_STUDENT_ID: studentId is required.');
  }

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', studentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', studentId);
    if (error) throw new Error(`UNLIKE_POST_ERROR: ${error.message}`);
    return false;
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: studentId,
  });

  if (error) throw new Error(`LIKE_POST_ERROR: ${error.message}`);
  return true;
}

/** Per-post like totals and whether the viewer has liked the post. */
export type PostLikeSummary = { count: number; likedByMe: boolean };

/**
 * Batch-load like counts and “liked by me” for feed cards.
 * Any authenticated user may thumbs-up any post; this reflects stored `post_likes` rows.
 */
export async function getLikeSummariesForPosts(
  postIds: string[],
  viewerId: string
): Promise<Record<string, PostLikeSummary>> {
  const summary: Record<string, PostLikeSummary> = {};
  for (const id of postIds) {
    summary[id] = { count: 0, likedByMe: false };
  }
  if (postIds.length === 0 || !viewerId) return summary;

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id, user_id')
    .in('post_id', postIds);

  if (error) throw new Error(`FETCH_LIKES_ERROR: ${error.message}`);

  for (const row of data ?? []) {
    const pid = row.post_id as string;
    if (!summary[pid]) continue;
    summary[pid].count++;
    if (row.user_id === viewerId) summary[pid].likedByMe = true;
  }

  return summary;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Fetches all comments for a post, including the author's username and PFP.
 */
export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!author(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`FETCH_COMMENTS_ERROR: ${error.message}`);

  return (data ?? []).map((d) => ({
    commentId: d.id,
    postId: d.post_id,
    authorId: d.user_id,
    authorName: d.author?.username ?? 'Anonymous',
    authorPFP: d.author?.avatar_url ?? null,
    content: d.content,
    createdAt: d.created_at,
  }));
}

/** Alias for older call sites / tests. */
export const getCommentsForPost = getCommentsByPost;

/**
 * Pre-condition : postId exists; authorId is the authenticated user; content non-empty and ≤ MAX_COMMENT_LENGTH.
 * Post-condition: Row inserted in `comments` (post_id, user_id, content). Returns Comment.
 */
export async function addComment(
  postId: string,
  authorId: string,
  content: string
): Promise<Comment> {
  if (!postId || String(postId).trim() === '') {
    throw new Error('INVALID_POST_ID: postId is required.');
  }
  if (!authorId || String(authorId).trim() === '') {
    throw new Error('INVALID_AUTHOR: authorId is required.');
  }
  if (!isValidContent(content)) {
    throw new Error('INVALID_CONTENT: Comment content cannot be empty.');
  }
  if (!isWithinCommentLimit(content)) {
    throw new Error(
      `COMMENT_TOO_LONG: Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`
    );
  }

  const { data: postRow, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .single();

  if (postError || !postRow) throw new Error('POST_NOT_FOUND: Post does not exist.');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: authorId,
      content: content.trim(),
    })
    .select('*, author:profiles!author(username, avatar_url)')
    .single();

  if (error) throw new Error(`ADD_COMMENT_ERROR: ${error.message}`);

  return {
    commentId: data.id,
    postId: data.post_id,
    authorId: data.user_id,
    authorName: data.author?.username ?? 'Anonymous',
    authorPFP: data.author?.avatar_url ?? null,
    content: data.content,
    createdAt: data.created_at,
  };
}

// ─── getFeedByCategory (FR8a, FR8c) ──────────────────────────────────────────

/**
 * Pre-condition : category is general or announcement (`events` tab uses `events` table in UI).
 * Post-condition: Returns all posts in that category, sorted newest-first (FR8c).
 */
export async function getFeedByCategory(category: string): Promise<Post[]> {
  if (!isValidCategory(category)) {
    throw new Error(
      'INVALID_CATEGORY: Category must be "general", "announcement", or "events".'
    );
  }
  if (category === 'events') {
    throw new Error(
      'INVALID_CATEGORY: Upcoming events are listed from the events table — use eventService.getNextUpcomingEvents.'
    );
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!author(username, avatar_url)')
    .eq('section', category)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`FETCH_FEED_ERROR: ${error.message}`);
  return (data ?? []).map(mapToPost);
}

// ─── getPostsByAuthor ─────────────────────────────────────────────────────────

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!author(username, avatar_url)')
    .eq('user_id', authorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`FETCH_AUTHOR_POSTS_ERROR: ${error.message}`);
  return (data ?? []).map(mapToPost);
}

// ─── searchFeed ───────────────────────────────────────────────────────────────

export async function searchFeed(query: string, category?: FeedCategory): Promise<Post[]> {
  if (!query || String(query).trim() === '') throw new Error('INVALID_QUERY');

  if (category != null && String(category).trim() !== '') {
    if (!isValidCategory(category)) {
      throw new Error('INVALID_CATEGORY');
    }
    if (category === 'events') {
      throw new Error(
        'INVALID_CATEGORY: Events are stored in the events table — use eventService.searchUpcomingEvents.'
      );
    }
  }

  let builder = supabase
    .from('posts')
    .select('*, author:profiles!author(username, avatar_url)')
    .ilike('content', `%${query.trim()}%`)
    .order('created_at', { ascending: false });

  if (category && isValidCategory(category)) {
    builder = (builder as any).eq('section', category);
  }

  const { data, error } = await builder;
  if (error) throw new Error(`SEARCH_FEED_ERROR: ${error.message}`);
  return (data ?? []).map(mapToPost);
}

// ─── Internal Mapper ───────────────────────────────────────────────────────────

function mapToPost(d: Record<string, any>): Post {
  const profile = Array.isArray(d.author) ? d.author[0] : d.author;

  return {
    postId: d.id,
    authorId: d.user_id,
    authorName: profile?.username ?? 'Anonymous',
    authorPFP: profile?.avatar_url ?? null,
    content: d.content,
    mediaUrl: d.media_url ?? null,
    type: d.section as FeedCategory,
    createdAt: d.created_at,
    metadata: d.metadata || {},
  };
}
