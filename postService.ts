/**
 * postService.ts — Campus Connect
 * Public Feed Subsystem — Post Use Cases
 *
 * Implements all methods from the Post class in the DCD:
 *   + create(content: String, type: String)    : Post
 *   + edit(content: String)                    : Boolean
 *   + delete()                                 : Boolean
 *   + like(studentId: String)                  : Boolean
 *
 * Additional use cases from requirements (FR8a, FR8b, FR8c, FR8d):
 *   + addComment(postId, authorId, content)    : Comment   — FR8d
 *   + getFeedByCategory(category)              : Post[]    — FR8a / FR8c
 *   + searchFeed(query, category?)             : Post[]    — FR8b
 */

import { supabase } from '../supabaseClient';
import type { Post, Comment, FeedCategory } from '../types';
import { VALID_FEED_CATEGORIES } from '../types';

// ─── Constants ─────────────────────────────────────────────────────────────────
export const MAX_POST_LENGTH = 250; // FR8: max 250 characters

// ─── Validation Helpers (exported for testing) ────────────────────────────────

export function isValidContent(content: string | null | undefined): boolean {
  if (content === null || content === undefined) return false;
  return String(content).trim().length > 0;
}

export function isWithinPostLimit(content: string): boolean {
  return String(content).trim().length <= MAX_POST_LENGTH;
}

export function isValidCategory(type: string | null | undefined): type is FeedCategory {
  if (!type) return false;
  return (VALID_FEED_CATEGORIES as string[]).includes(type);
}

// ─── create(content, type) : Post ─────────────────────────────────────────────

/**
 * Pre-condition : authorId references an authenticated user.
 *                 content is non-empty and ≤ 250 chars. type is a valid FeedCategory.
 * Post-condition: Post saved to database; returned Post object matches the DCD.
 */
export async function createPost(
  authorId: string,
  content: string,
  type: FeedCategory
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
    throw new Error(
      'INVALID_TYPE: Post type must be "general", "announcement", or "event".'
    );
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id:  authorId,
      content:    content.trim(),
      type,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`CREATE_POST_ERROR: ${error.message}`);

  return mapToPost(data);
}

// ─── edit(content) : Boolean ──────────────────────────────────────────────────

/**
 * Pre-condition : postId exists and authorId matches the post's author.
 * Post-condition: Post content updated in the database. Returns true.
 */
export async function editPost(
  postId: string,
  authorId: string,
  newContent: string
): Promise<boolean> {
  if (!postId || String(postId).trim() === '') {
    throw new Error('INVALID_POST_ID: postId is required.');
  }
  if (!isValidContent(newContent)) {
    throw new Error('INVALID_CONTENT: Post content cannot be empty.');
  }
  if (!isWithinPostLimit(newContent)) {
    throw new Error(
      `CONTENT_TOO_LONG: Post must be ${MAX_POST_LENGTH} characters or fewer.`
    );
  }

  // Verify post exists and requester is the author
  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (fetchError || !existing) throw new Error('POST_NOT_FOUND: Post does not exist.');
  if (existing.author_id !== authorId) {
    throw new Error('UNAUTHORIZED: You can only edit your own posts.');
  }

  const { error } = await supabase
    .from('posts')
    .update({ content: newContent.trim() })
    .eq('id', postId);

  if (error) throw new Error(`EDIT_POST_ERROR: ${error.message}`);
  return true;
}

// ─── delete() : Boolean ───────────────────────────────────────────────────────

/**
 * Pre-condition : postId exists and authorId matches the post's author.
 * Post-condition: Post removed from the database. Returns true.
 */
export async function deletePost(
  postId: string,
  authorId: string
): Promise<boolean> {
  if (!postId || String(postId).trim() === '') {
    throw new Error('INVALID_POST_ID: postId is required.');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (fetchError || !existing) throw new Error('POST_NOT_FOUND: Post does not exist.');
  if (existing.author_id !== authorId) {
    throw new Error('UNAUTHORIZED: You can only delete your own posts.');
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw new Error(`DELETE_POST_ERROR: ${error.message}`);
  return true;
}

// ─── like(studentId) : Boolean ────────────────────────────────────────────────

/**
 * Pre-condition : postId exists. Student has not already liked this post.
 * Post-condition: Like recorded in database. Returns true.
 */
export async function likePost(
  postId: string,
  studentId: string
): Promise<boolean> {
  if (!postId || String(postId).trim() === '') {
    throw new Error('INVALID_POST_ID: postId is required.');
  }
  if (!studentId || String(studentId).trim() === '') {
    throw new Error('INVALID_STUDENT_ID: studentId is required.');
  }

  // Check for duplicate like
  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('student_id', studentId)
    .single();

  if (existing) throw new Error('ALREADY_LIKED: You have already liked this post.');

  const { error } = await supabase.from('post_likes').insert({
    post_id:    postId,
    student_id: studentId,
  });

  if (error) throw new Error(`LIKE_POST_ERROR: ${error.message}`);
  return true;
}

// ─── addComment (FR8d) ────────────────────────────────────────────────────────

/**
 * Pre-condition : postId exists. content is non-empty.
 * Post-condition: Comment saved and linked to post in database. Returns Comment.
 */
export async function addComment(
  postId: string,
  authorId: string,
  content: string
): Promise<Comment> {
  if (!postId || String(postId).trim() === '') {
    throw new Error('INVALID_POST_ID: postId is required.');
  }
  if (!isValidContent(content)) {
    throw new Error('INVALID_CONTENT: Comment content cannot be empty.');
  }

  // Verify the post exists
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .single();

  if (postError || !post) throw new Error('POST_NOT_FOUND: Post does not exist.');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id:    postId,
      author_id:  authorId,
      content:    content.trim(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`ADD_COMMENT_ERROR: ${error.message}`);

  return {
    commentId: data.id,
    postId:    data.post_id,
    authorId:  data.author_id,
    content:   data.content,
    createdAt: data.created_at,
  };
}

// ─── getFeedByCategory (FR8a, FR8c) ───────────────────────────────────────────

/**
 * Pre-condition : category is one of 'general' | 'announcement' | 'event'.
 * Post-condition: Returns all posts in that category, sorted newest-first (FR8c).
 */
export async function getFeedByCategory(category: string): Promise<Post[]> {
  if (!isValidCategory(category)) {
    throw new Error(
      'INVALID_CATEGORY: Category must be "general", "announcement", or "event".'
    );
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('type', category)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`FETCH_FEED_ERROR: ${error.message}`);

  return (data ?? []).map(mapToPost);
}

// ─── searchFeed (FR8b) ────────────────────────────────────────────────────────

/**
 * Pre-condition : query is a non-empty string.
 * Post-condition: Returns posts whose content matches the query, newest-first.
 *                 Optionally filtered by category.
 */
export async function searchFeed(
  query: string,
  category?: FeedCategory
): Promise<Post[]> {
  if (!query || String(query).trim() === '') {
    throw new Error('INVALID_QUERY: Search query cannot be empty.');
  }

  let builder = supabase
    .from('posts')
    .select('*')
    .ilike('content', `%${query.trim()}%`)
    .order('created_at', { ascending: false });

  if (category && isValidCategory(category)) {
    builder = (builder as any).eq('type', category);
  }

  const { data, error } = await builder;
  if (error) throw new Error(`SEARCH_FEED_ERROR: ${error.message}`);

  return (data ?? []).map(mapToPost);
}

// ─── Internal Mapper ──────────────────────────────────────────────────────────

function mapToPost(d: Record<string, any>): Post {
  return {
    postId:    d.id,
    authorId:  d.author_id,
    content:   d.content,
    mediaUrl:  d.media_url ?? null,
    type:      d.type as FeedCategory,
    createdAt: d.created_at,
  };
}
