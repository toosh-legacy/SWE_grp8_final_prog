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
import type { Post, FeedCategory } from '@/index';
import { getFeedByCategory, searchFeed, likePost } from '@/postService';
import CreatePostForm from './CreatePostForm';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PostFeedProps {
  currentUserId: string;
}

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: FeedCategory }[] = [
  { label: 'General',       value: 'general'      },
  { label: 'Events',        value: 'event'         },
  { label: 'Announcements', value: 'announcement'  },
];

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
      setPosts(data);
    } catch (err: any) {
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      setPosts(results);
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
      // Optimistically reflect the like — a real app would re-fetch or update count
    } catch (err: any) {
      // Silently swallow ALREADY_LIKED; surface other errors if needed
      if (!err.message.includes('ALREADY_LIKED')) {
        setError('Could not like post. Please try again.');
      }
    }
  }

  // ── Post created callback ────────────────────────────────────────────────────

  function handlePostCreated(newPost: Post) {
    // Prepend new post to the top of the feed (FR8c: newest first)
    if (newPost.type === activeTab) {
      setPosts((prev) => [newPost, ...prev]);
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
              defaultType={activeTab === 'event' ? 'event' : activeTab === 'announcement' ? 'announcement' : 'general'}
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
            <div className="feed-empty">
              {isSearching
                ? 'No posts matched your search.'
                : `No ${activeTab} posts yet. Be the first to post!`}
            </div>
          ) : (
            <ul className="post-list" role="list">
              {posts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  onLike={() => handleLike(post.postId)}
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
// PostCard Sub-component
// =============================================================================

interface PostCardProps {
  post: Post;
  onLike: () => void;
}

function PostCard({ post, onLike }: PostCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });

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
            className="post-card__icon-action"
            aria-label="Comments (coming soon)"
            disabled
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
          <button
            type="button"
            className="post-card__icon-action"
            onClick={onLike}
            aria-label="Like this post"
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
      </div>
    </li>
  );
}
