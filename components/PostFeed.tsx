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
import type { Post, FeedCategory, CampusEvent } from '@/index';
import { getNextUpcomingEvents, searchUpcomingEvents, EVENT_FEED_TAB_LIMIT } from '@/eventService';
import {
  getFeedByCategory,
  searchFeed,
  likePost,
  deletePost,
  getLikeSummariesForPosts,
} from '@/postService';
import CreatePostForm from './CreatePostForm';
import CommentSection from './CommentSection';
import { Heart, MessageCircle, Trash2, MapPin, Calendar } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PostFeedProps {
  currentUserId: string;
}

// ─── Tab & feed config ─────────────────────────────────────────────────────────

const TABS: { label: string; value: FeedCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Events', value: 'events' },
  { label: 'Announcements', value: 'announcement' },
];

/** Display name for empty-state copy (matches tab labels). */
const TAB_SECTION_LABEL: Record<FeedCategory, string> = {
  general: 'General',
  events: 'Events',
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
  if (tab === 'events') {
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
        if (category === 'events') {
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
      if (activeTab === 'events') {
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
      activeTab === 'events' ? [ev, ...prev.filter((e) => e.eventId !== ev.eventId)] : prev
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
                activeTab === 'events'
                  ? 'events'
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
          ) : activeTab === 'events' ? (
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
  const [commentsOpen, setCommentsOpen] = useState(false);

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const liked = !!post.likedByMe;
  const likeCount = post.likeCount ?? 0;

  return (
    <li className="post-card" aria-label={`Post by ${post.authorName}`}>
      <div className="post-card__header">
        <div className="post-card__author">
          {post.authorPFP ? (
            <img
              src={post.authorPFP}
              alt=""
              className="post-card__avatar-img"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span className="post-card__avatar" aria-hidden />
          )}

          <span className="post-card__user-label">{post.authorName}</span>

          <time className="post-card__date" dateTime={post.createdAt}>
            <span className="post-card__date-text">{formattedDate}</span>
          </time>
        </div>

        <div
          className="post-card__actions"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <span className={`post-tag post-tag--${post.type}`}>{post.type}</span>

          <div className="post-card__toolbar" style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              className={`post-card__icon-action ${commentsOpen ? 'active' : ''}`}
              onClick={() => setCommentsOpen((o) => !o)}
              aria-label={commentsOpen ? 'Hide comments' : 'Show comments'}
              aria-expanded={commentsOpen}
            >
              <MessageCircle size={18} strokeWidth={2} />
            </button>

            <button
              type="button"
              className={`post-card__icon-action post-card__like ${liked ? 'post-card__like--active' : ''}`}
              onClick={onLike}
              aria-label={liked ? 'Remove your like from this post' : 'Like this post'}
              aria-pressed={liked}
            >
              <Heart size={18} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
            </button>

            {likeCount > 0 ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{likeCount}</span>
            ) : null}

            {post.authorId === currentUserId && (
              <button
                type="button"
                onClick={onDelete}
                className="post-card__icon-action"
                aria-label="Delete post"
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="post-card__body">
        {post.type === 'events' && post.metadata?.title && (
          <div className="post-event">
            <h4 className="post-event__title">{post.metadata.title}</h4>

            <div className="post-event__row">
              <MapPin className="post-event__icon" />
              <span>{post.metadata.location}</span>
            </div>

            <div className="post-event__row">
              <Calendar className="post-event__icon" />
              <span>
                {new Date(post.metadata.eventDate!).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>
        )}

        <p className="post-card__content">{post.content}</p>

        {post.mediaUrl && (
          <img src={post.mediaUrl} alt="Post attachment" className="post-card__media" />
        )}
      </div>

      {commentsOpen && (
        <CommentSection postId={post.postId} currentUserId={currentUserId} />
      )}
    </li>
  );
}
