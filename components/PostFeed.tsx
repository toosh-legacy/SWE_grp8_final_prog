'use client';

/**
 * PostFeed.tsx — Campus Connect
 * Public Feed Page
 *
 * Covers FR8a (feed sections), FR8b (search), FR8c (sort by date), FR8d (like/comment).
 * Calls postService for general/announcement posts; Events tab reads the `events` table via eventService.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import type { Post, FeedCategory, Comment, CampusEvent } from '@/index';
import { getNextUpcomingEvents, searchUpcomingEvents, EVENT_FEED_TAB_LIMIT } from '@/eventService';
import {
  getFeedByCategory,
  searchFeed,
  likePost,
  deletePost,
  getLikeSummariesForPosts,
  addComment,
  getCommentsForPost,
  MAX_COMMENT_LENGTH,
} from '@/postService';
import CreatePostForm from './CreatePostForm';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PostFeedProps {
  currentUserId: string;
}

// ─── Tab & feed config ─────────────────────────────────────────────────────────

const TABS: { label: string; value: FeedCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Events', value: 'event' },
  { label: 'Announcements', value: 'announcement' },
];

/** Display name for empty-state copy (matches tab labels). */
const TAB_SECTION_LABEL: Record<FeedCategory, string> = {
  general: 'General',
  event: 'Events',
  announcement: 'Announcements',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Merge like counts / liked-by-me flags into feed posts for the current viewer. */
async function withLikeSummaries(postList: Post[], viewerId: string): Promise<Post[]> {
  if (postList.length === 0) return postList;
  const summaries = await getLikeSummariesForPosts(
    postList.map((p) => p.postId),
    viewerId
  );
  return postList.map((p) => ({
    ...p,
    likeCount: summaries[p.postId]?.count ?? 0,
    likedByMe: summaries[p.postId]?.likedByMe ?? false,
  }));
}

function emptyFeedMessage(tab: FeedCategory, isSearching: boolean, query: string) {
  if (tab === 'event') {
    if (isSearching) {
      return {
        title: 'No events to display',
        detail: `No upcoming events matched your search${query ? ` for "${query}"` : ''}.`,
      };
    }
    return {
      title: 'No upcoming events',
      detail: `There are no upcoming events in the Events tab right now.`,
    };
  }
  if (isSearching) {
    return {
      title: 'No posts to display',
      detail: `There is no information to show for your search. No results for "${query}".`,
    };
  }
  return {
    title: 'No posts to display',
    detail: `There is no information to load for the ${TAB_SECTION_LABEL[tab]} tab right now.`,
  };
}

// ─── PostFeed (main) ───────────────────────────────────────────────────────────

export default function PostFeed({ currentUserId }: PostFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedCategory>('general');
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedEvents, setFeedEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // ── Fetch: load feed by tab ─────────────────────────────────────────────────

  const loadFeed = useCallback(
    async (category: FeedCategory) => {
      setLoading(true);
      setError('');
      try {
        if (category === 'event') {
          setPosts([]);
          const evs = await getNextUpcomingEvents(EVENT_FEED_TAB_LIMIT);
          setFeedEvents(evs);
        } else {
          setFeedEvents([]);
          const data = await getFeedByCategory(category);
          setPosts(await withLikeSummaries(data, currentUserId));
        }
      } catch (err: unknown) {
        console.error('Failed to load feed:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    if (!isSearching) loadFeed(activeTab);
  }, [activeTab, isSearching, loadFeed]);

  // ── Search ────────────────────────────────────────────────────────────────────

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadFeed(activeTab);
      return;
    }
    setLoading(true);
    setError('');
    setIsSearching(true);
    try {
      if (activeTab === 'event') {
        setPosts([]);
        const results = await searchUpcomingEvents(
          searchQuery.trim(),
          EVENT_FEED_TAB_LIMIT
        );
        setFeedEvents(results);
      } else {
        const results = await searchFeed(searchQuery.trim(), activeTab);
        setPosts(await withLikeSummaries(results, currentUserId));
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setSearchQuery('');
    setIsSearching(false);
    loadFeed(activeTab);
  }

  // ── Like / delete ─────────────────────────────────────────────────────────────

  async function handleLike(postId: string) {
    try {
      const nowLiked = await likePost(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.postId !== postId) return p;
          const was = p.likedByMe ?? false;
          let count = p.likeCount ?? 0;
          if (!was && nowLiked) count += 1;
          if (was && !nowLiked) count -= 1;
          return {
            ...p,
            likedByMe: nowLiked,
            likeCount: Math.max(0, count),
          };
        })
      );
    } catch (err: unknown) {
      console.error('Like toggle failed:', err);
      setError('Could not update like. Please try again.');
    }
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(postId, currentUserId);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch {
      setError('Could not delete post. Please try again.');
    }
  }

  // ── Post created callback ─────────────────────────────────────────────────────

  function handlePostCreated(newPost: Post) {
    if (newPost.type === activeTab) {
      const enriched: Post = {
        ...newPost,
        likeCount: 0,
        likedByMe: false,
      };
      setPosts((prev) => [enriched, ...prev]);
    }
    setShowCreate(false);
  }

  function handleEventCreated(ev: CampusEvent) {
    setFeedEvents((prev) =>
      activeTab === 'event' ? [ev, ...prev.filter((e) => e.eventId !== ev.eventId)] : prev
    );
    setShowCreate(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="home-hub">
      <div className="home-hub__feed">
        {/* Header: title, search, new post */}
        <div className="feed-header">
          <h2 className="feed-title">Feed</h2>
          <form className="feed-search" onSubmit={handleSearch} role="search">
            <input
              type="search"
              className="feed-search__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search feed"
            />
            {isSearching && (
              <button type="button" className="feed-search__clear" onClick={clearSearch}>
                Clear
              </button>
            )}
            <button
              type="submit"
              className="feed-search__submit"
              disabled={loading}
              aria-label="Search"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7.75" />
                <path d="M20 20l-5-5" />
              </svg>
            </button>
          </form>
          <button
            type="button"
            className="btn btn-primary btn-feed-create-inline"
            onClick={() => setShowCreate((s) => !s)}
            aria-expanded={showCreate}
          >
            {showCreate ? 'Cancel' : '+ New Post'}
          </button>
        </div>

        {/* Category tabs */}
        <nav className="feed-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              className={`feed-tab ${activeTab === tab.value ? 'feed-tab--active' : ''}`}
              onClick={() => {
                setActiveTab(tab.value);
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Create post panel */}
        {showCreate && (
          <div className="create-post-panel">
            <CreatePostForm
              authorId={currentUserId}
              defaultType={
                activeTab === 'event'
                  ? 'event'
                  : activeTab === 'announcement'
                    ? 'announcement'
                    : 'general'
              }
              onPostCreated={handlePostCreated}
              onEventCreated={handleEventCreated}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {/* Search context */}
        {isSearching && (
          <p className="feed-search-label">
            Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
          </p>
        )}

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="feed-page">
          {/* Post list or empty / loading */}
          {loading ? (
            <div className="feed-loading" aria-live="polite">
              Loading…
            </div>
          ) : activeTab === 'event' ? (
            feedEvents.length === 0 ? (
              <FeedEmptyState
                tab={activeTab}
                isSearching={isSearching}
                searchQuery={searchQuery}
              />
            ) : (
              <ul className="post-list" role="list">
                {feedEvents.map((ev) => (
                  <EventFeedCard key={ev.eventId} ev={ev} />
                ))}
              </ul>
            )
          ) : posts.length === 0 ? (
            <FeedEmptyState
              tab={activeTab}
              isSearching={isSearching}
              searchQuery={searchQuery}
            />
          ) : (
            <ul className="post-list" role="list">
              {posts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  currentUserId={currentUserId}
                  onLike={() => handleLike(post.postId)}
                  onDelete={() => handleDeletePost(post.postId)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="feed-fab-slot">
        <span className="feed-fab-label">Create Post</span>
        <button
          type="button"
          className="feed-create-fab"
          title={showCreate ? 'Close create post' : 'Create Post'}
          aria-label={showCreate ? 'Close create post panel' : 'Create Post'}
          onClick={() => setShowCreate((s) => !s)}
        >
          <span aria-hidden className="feed-create-fab__plus">
            {showCreate ? '\u2715' : '+'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── EventFeedCard (`events` table — no likes/comments row) ────────────────────

function EventFeedCard({ ev }: { ev: CampusEvent }) {
  const formattedStart = new Date(ev.startTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li className="post-card post-card--event-feed" aria-label={`Event: ${ev.title}`}>
      <div className="post-card__header">
        <div className="post-card__author">
          <span className="post-card__avatar" aria-hidden />
          <span className="post-card__user-label">Event</span>
          <time className="post-card__date" dateTime={ev.startTime}>
            <span className="post-card__date-text">{formattedStart}</span>
          </time>
        </div>
      </div>
      <div className="post-card__body">
        <p className="post-card__content post-card__event-feed-title">{ev.title}</p>
        {ev.description ? (
          <p className="post-card__content post-card__event-feed-desc">{ev.description}</p>
        ) : null}
        <p className="post-card__event-feed-meta">
          <span>{ev.location}</span>
          {' · '}
          <span>
            {ev.capacity} attendee{ev.capacity === 1 ? '' : 's'} max
          </span>
        </p>
      </div>
    </li>
  );
}

// ─── FeedEmptyState ────────────────────────────────────────────────────────────

function FeedEmptyState({
  tab,
  isSearching,
  searchQuery,
}: {
  tab: FeedCategory;
  isSearching: boolean;
  searchQuery: string;
}) {
  const { title, detail } = emptyFeedMessage(tab, isSearching, searchQuery.trim());
  return (
    <div className="feed-empty" role="status">
      <p className="feed-empty__title">{title}</p>
      <p className="feed-empty__detail">{detail}</p>
    </div>
  );
}

// ─── PostCard ──────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: () => void;
  onDelete: () => void;
}

function PostCard({ post, currentUserId, onLike, onDelete }: PostCardProps) {
  // ── Local state ───────────────────────────────────────────────────────────────

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isOwner = post.authorId === currentUserId;
  const likes = post.likeCount ?? 0;
  const liked = !!post.likedByMe;

  // ── Comment panel ───────────────────────────────────────────────────────────

  async function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next) {
      setCommentsLoading(true);
      try {
        const list = await getCommentsForPost(post.postId);
        setComments(list);
      } catch (err) {
        console.error('Failed to load comments:', err);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }
  }

  async function handleCommentSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const created = await addComment(post.postId, currentUserId, trimmed);
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <li className="post-card" aria-label={`Post by ${post.authorId}`}>
      <div className="post-card__header">
        <div className="post-card__author">
          <span className="post-card__avatar" aria-hidden />
          <span className="post-card__user-label">User</span>
          <time className="post-card__date" dateTime={post.createdAt}>
            <span className="post-card__date-text">{formattedDate}</span>
          </time>
        </div>
        <div className="post-card__toolbar">
          <button
            type="button"
            className={`post-card__icon-action ${commentsOpen ? 'post-card__icon-action--active' : ''}`}
            aria-label={commentsOpen ? 'Hide comments' : 'View and add comments'}
            aria-expanded={commentsOpen}
            onClick={toggleComments}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 12a9 9 0 01-9 9H7l-4 4V12a9 9 0 019-9z" />
              <circle cx="8" cy="12" r=".75" fill="currentColor" />
              <circle cx="12" cy="12" r=".75" fill="currentColor" />
              <circle cx="16" cy="12" r=".75" fill="currentColor" />
            </svg>
          </button>
          <div className="post-card__like-wrap">
            <button
              type="button"
              className={`post-card__icon-action post-card__like ${liked ? 'post-card__like--active' : ''}`}
              onClick={onLike}
              aria-label={liked ? 'Remove your like from this post' : 'Like this post'}
              aria-pressed={liked}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>
            <span className="post-card__like-count" title={`${likes} like${likes === 1 ? '' : 's'}`}>
              {likes}
            </span>
          </div>
          {isOwner && (
            <button
              type="button"
              className="post-card__icon-action post-card__delete"
              onClick={onDelete}
              aria-label="Delete your post"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          )}
          <span className="post-card__chevron" aria-hidden>
            &#8250;
          </span>
        </div>
      </div>

      <div className="post-card__body">
        <p className="post-card__content">{post.content}</p>

        {post.mediaUrl && (
          <img
            src={post.mediaUrl}
            alt="Post attachment"
            className="post-card__media"
          />
        )}

        {commentsOpen && (
          <section className="post-card__comments" aria-label="Comments">
            {commentsLoading ? (
              <p className="post-card__comments-status">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="post-card__comments-status">No comments yet. Be the first to reply.</p>
            ) : (
              <ul className="post-card__comment-list" role="list">
                {comments.map((c) => (
                  <li key={c.commentId} className="post-card__comment">
                    <div className="post-card__comment-meta">
                      <span className="post-card__comment-author">
                        {c.authorId === currentUserId ? 'You' : 'User'}
                      </span>
                      <time className="post-card__comment-time" dateTime={c.createdAt}>
                        {new Date(c.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className="post-card__comment-body">{c.content}</p>
                  </li>
                ))}
              </ul>
            )}

            <form className="post-card__comment-form" onSubmit={handleCommentSubmit}>
              <label htmlFor={`comment-${post.postId}`} className="sr-only">
                Write a comment
              </label>
              <textarea
                id={`comment-${post.postId}`}
                className="post-card__comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                maxLength={MAX_COMMENT_LENGTH}
                disabled={commentSubmitting}
              />
              <div className="post-card__comment-form-footer">
                <span className="post-card__comment-counter">
                  {commentText.length}/{MAX_COMMENT_LENGTH}
                </span>
                <button
                  type="submit"
                  className="btn btn-primary btn-comment-submit"
                  disabled={commentSubmitting || !commentText.trim()}
                >
                  {commentSubmitting ? 'Posting…' : 'Comment'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </li>
  );
}
