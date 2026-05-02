'use client';

/**
 * PostFeed.tsx — Campus Connect
 * Public Feed Page
 *
 * Covers FR8a (feed sections), FR8b (search), FR8c (sort by date), FR8d (like/comment)
 * Calls postService and eventService from the service layer.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import type { Post, FeedCategory, Comment } from '@/index';
import {
  getFeedByCategory,
  searchFeed,
  likePost,
  deletePost,
  getLikeSummariesForPosts,
  addComment,
  MAX_COMMENT_LENGTH,
} from '@/postService';
import CreatePostForm from './CreatePostForm';
import CommentSection from './CommentSection';
import { Heart, MessageCircle, Trash2, MapPin, Calendar } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PostFeedProps {
  currentUserId: string;
}

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: FeedCategory }[] = [
  { label: 'General',       value: 'general'      },
  { label: 'Events',        value: 'events'         },
  { label: 'Announcements', value: 'announcement'  },
];

/** Display name for empty-state copy (matches tab labels). */
const TAB_SECTION_LABEL: Record<FeedCategory, string> = {
  general: 'General',
  events: 'Events',
  announcement: 'Announcements',
};

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

// =============================================================================
// PostFeed Component
// =============================================================================

export default function PostFeed({ currentUserId }: PostFeedProps) {
  const [activeTab,    setActiveTab]    = useState<FeedCategory>('general');
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isSearching,  setIsSearching]  = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);

  // ── Fetch posts when tab changes ─────────────────────────────────────────────

  const loadFeed = useCallback(async (category: FeedCategory) => {
    setLoading(true);
    setError('');
    try {
      const data = await getFeedByCategory(category);
      setPosts(await withLikeSummaries(data, currentUserId));
    } catch (err: unknown) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!isSearching) loadFeed(activeTab);
  }, [activeTab, isSearching, loadFeed]);

  // ── Search ───────────────────────────────────────────────────────────────────

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
      const results = await searchFeed(searchQuery.trim(), activeTab);
      setPosts(await withLikeSummaries(results, currentUserId));
    } catch (err: any) {
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

  // ── Like ─────────────────────────────────────────────────────────────────────

  async function handleLike(postId: string) {
    try {
      await likePost(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === postId
            ? {
                ...p,
                likeCount: (p.likeCount ?? 0) + 1,
                likedByMe: true,
              }
            : p
        )
      );
    } catch (err: any) {
      if (err.message?.includes('ALREADY_LIKED')) {
        setPosts((prev) =>
          prev.map((p) => (p.postId === postId ? { ...p, likedByMe: true } : p))
        );
        return;
      }
      setError('Could not like post. Please try again.');
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

  // ── Post created callback ────────────────────────────────────────────────────

  function handlePostCreated(newPost: Post) {
    // Prepend new post to the top of the feed (FR8c: newest first)
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="home-hub">
      <div className="home-hub__feed">
        {/* Header */}
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

        {/* Category Tabs */}
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

        {/* Create Post Panel */}
        {showCreate && (
          <div className="create-post-panel">
            <CreatePostForm
              authorId={currentUserId}
              defaultType={activeTab === 'events' ? 'events' : activeTab === 'announcement' ? 'announcement' : 'general'}
              onPostCreated={handlePostCreated}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {/* Search context label */}
        {isSearching && (
          <p className="feed-search-label">
            Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
          </p>
        )}

        {/* Error Banner */}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="feed-page">
          {/* Feed Content */}
          {loading ? (
            <div className="feed-loading" aria-live="polite">Loading posts…</div>
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

      <aside className="home-hub__events" aria-label="Upcoming events preview">
        <h3 className="home-hub__events-title sr-only">Events calendar</h3>
        <ul className="event-preview-list">
          <li className="event-preview-card">
            <span className="event-preview-card__date">APRIL 5</span>
            <span className="event-preview-card__title">Event 1</span>
          </li>
          <li className="event-preview-card">
            <span className="event-preview-card__date">APRIL 6</span>
            <span className="event-preview-card__title">Event 2</span>
          </li>
          <li className="event-preview-card">
            <span className="event-preview-card__date">APRIL 7</span>
            <span className="event-preview-card__title">Event 3</span>
          </li>
        </ul>
      </aside>

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

// =============================================================================
// FeedEmptyState
// =============================================================================

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

// =============================================================================
// PostCard Sub-component
// =============================================================================

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: () => void;
  onDelete: () => void;
}

// =============================================================================
// PostCard Sub-component
// =============================================================================

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
    day:   'numeric',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });

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
          
          <span className="post-card__user-label">
            {post.authorName}
          </span>

          <time className="post-card__date" dateTime={post.createdAt}>
            <span className="post-card__date-text">{formattedDate}</span>
          </time>
        </div>
        
        <div className="post-card__actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`post-tag post-tag--${post.type}`}>
            {post.type}
          </span>

          <div className="post-card__toolbar" style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              className={`post-card__icon-action ${commentsOpen ? 'active' : ''}`}
              onClick={() => setCommentsOpen(!commentsOpen)}
              aria-label="Toggle comments"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M21 12a9 9 0 01-9 9H7l-4 4V12a9 9 0 019-9z" />
              </svg>
            </button>
            
            <button
              type="button"
              className={`post-card__icon-action ${post.likedByMe ? 'text-red-500' : ''}`}
              onClick={onLike}
              aria-label="Like this post"
            >
              {/* If you have a solid heart SVG for liked, put it here! */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>
            {/* Show like count if > 0 */}
            {post.likeCount && post.likeCount > 0 ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{post.likeCount}</span>
            ) : null}

            {/* Optional Delete Button for post owner */}
            {post.authorId === currentUserId && (
               <button onClick={onDelete} className="post-card__icon-action" aria-label="Delete post">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
               </button>
            )}
          </div>
        </div>
      </div>

      <div className="post-card__body">
        {/* Render Event Metadata if it exists */}
        {post.type === 'events' && post.metadata?.title && (
          <div className="post-event">
            <h4 className="post-event__title">
              {post.metadata.title}
            </h4>

            <div className="post-event__row">
              <MapPin className="post-event__icon"  />
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

      {/* The ONE clean Comment Section */}
      {commentsOpen && (
        <CommentSection postId={post.postId} currentUserId={currentUserId} />
      )}
    </li>
  );
}
