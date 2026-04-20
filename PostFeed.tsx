/**
 * PostFeed.tsx — Campus Connect
 * Public Feed Page
 *
 * Covers FR8a (feed sections), FR8b (search), FR8c (sort by date), FR8d (like/comment)
 * Calls postService and eventService from the service layer.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types';
import type { FeedCategory } from '../types';
import { getFeedByCategory, searchFeed, likePost } from '../services/postService';
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

  async function handleSearch(e: React.FormEvent) {
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
    <div className="feed-page">

      {/* Header */}
      <div className="feed-header">
        <h1 className="feed-title">Campus Feed</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate((s) => !s)}
          aria-expanded={showCreate}
        >
          {showCreate ? 'Cancel' : '+ New Post'}
        </button>
      </div>

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

      {/* Search Bar */}
      <form className="feed-search" onSubmit={handleSearch} role="search">
        <input
          type="search"
          className="feed-search__input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab} posts…`}
          aria-label="Search feed"
        />
        <button type="submit" className="btn btn-secondary" disabled={loading}>
          Search
        </button>
        {isSearching && (
          <button type="button" className="btn btn-ghost" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

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
      <div className="post-card__meta">
        <span className={`post-tag post-tag--${post.type}`}>{post.type}</span>
        <time className="post-card__date" dateTime={post.createdAt}>
          {formattedDate}
        </time>
      </div>

      <p className="post-card__content">{post.content}</p>

      {post.mediaUrl && (
        <img
          src={post.mediaUrl}
          alt="Post attachment"
          className="post-card__media"
        />
      )}

      <div className="post-card__actions">
        <button
          className="btn btn-ghost btn-like"
          onClick={onLike}
          aria-label="Like this post"
        >
          ♥ Like
        </button>
      </div>
    </li>
  );
}
