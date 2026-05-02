'use client';

/**
 * PostFeed.tsx — Campus Connect
 * Main home feed (tabs, posts, events from DB, create post).
 *
 * Covers FR8a (sections), FR8c (newest first via services), FR8d (likes/comments).
 * General/announcement rows come from postService; the Events tab uses eventService.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Post, FeedCategory, CampusEvent } from '@/index';
import { getNextUpcomingEvents, EVENT_FEED_TAB_LIMIT } from '@/eventService';
import {
  getFeedByCategory,
  likePost,
  deletePost,
  getLikeSummariesForPosts,
} from '@/postService';
import { Heart, MessageCircle, Trash2, MapPin, Calendar } from 'lucide-react';
import CreatePostForm from './CreatePostForm';
import CommentSection from './CommentSection';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PostFeedProps {
  currentUserId: string;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: () => void;
  onDelete: () => void;
}

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: FeedCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Events', value: 'events' },
  { label: 'Announcements', value: 'announcement' },
];

const TAB_LABEL: Record<FeedCategory, string> = {
  general: 'General',
  events: 'Events',
  announcement: 'Announcements',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatFeedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function withLikeSummaries(posts: Post[], viewerId: string): Promise<Post[]> {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.postId);
  const summaries = await getLikeSummariesForPosts(ids, viewerId);
  return posts.map((p) => ({
    ...p,
    likeCount: summaries[p.postId]?.count ?? 0,
    likedByMe: summaries[p.postId]?.likedByMe ?? false,
  }));
}

function emptyStateCopy(tab: FeedCategory): { title: string; detail: string } {
  if (tab === 'events') {
    return {
      title: 'No upcoming events',
      detail: 'Nothing on the calendar for this tab yet.',
    };
  }
  return {
    title: 'No posts to display',
    detail: `Nothing in ${TAB_LABEL[tab]} right now.`,
  };
}

function defaultTypeForTab(tab: FeedCategory): FeedCategory {
  if (tab === 'events') return 'events';
  if (tab === 'announcement') return 'announcement';
  return 'general';
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PostFeed({ currentUserId }: PostFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedCategory>('general');
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedEvents, setFeedEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadFeed = useCallback(
    async (category: FeedCategory) => {
      setLoading(true);
      setError('');
      try {
        if (category === 'events') {
          setPosts([]);
          setFeedEvents(await getNextUpcomingEvents(EVENT_FEED_TAB_LIMIT));
        } else {
          setFeedEvents([]);
          const rows = await getFeedByCategory(category);
          setPosts(await withLikeSummaries(rows, currentUserId));
        }
      } catch (err) {
        console.error('loadFeed:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    void loadFeed(activeTab);
  }, [activeTab, loadFeed]);

  async function handleLike(postId: string) {
    try {
      const nowLiked = await likePost(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.postId !== postId) return p;
          const was = p.likedByMe ?? false;
          let n = p.likeCount ?? 0;
          if (!was && nowLiked) n++;
          if (was && !nowLiked) n--;
          return { ...p, likedByMe: nowLiked, likeCount: Math.max(0, n) };
        })
      );
    } catch {
      setError('Could not update like.');
    }
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(postId, currentUserId);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch {
      setError('Could not delete post.');
    }
  }

  function onPostCreated(newPost: Post) {
    if (newPost.type === activeTab) {
      setPosts((prev) => [{ ...newPost, likeCount: 0, likedByMe: false }, ...prev]);
    }
    setShowCreate(false);
  }

  function onEventCreated(ev: CampusEvent) {
    if (activeTab === 'events') {
      setFeedEvents((prev) => [ev, ...prev.filter((e) => e.eventId !== ev.eventId)]);
    }
    setShowCreate(false);
  }

  return (
    <div className="home-hub">
      <div className="home-hub__feed">
        <div className="feed-header">
          <h2 className="feed-title">Feed</h2>
          <button
            type="button"
            className="btn btn-primary btn-feed-create-inline"
            onClick={() => setShowCreate((v) => !v)}
            aria-expanded={showCreate}
          >
            {showCreate ? 'Cancel' : '+ New Post'}
          </button>
        </div>

        <nav className="feed-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={`feed-tab ${activeTab === tab.value ? 'feed-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {showCreate && (
          <div className="create-post-panel">
            <CreatePostForm
              authorId={currentUserId}
              defaultType={defaultTypeForTab(activeTab)}
              onPostCreated={onPostCreated}
              onEventCreated={onEventCreated}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {error ? (
          <div className="error-banner" role="alert">
            {error}
          </div>
        ) : null}

        <div className="feed-page">
          {loading ? (
            <div className="feed-loading" aria-live="polite">
              Loading…
            </div>
          ) : activeTab === 'events' ? (
            feedEvents.length === 0 ? (
              <FeedEmpty tab={activeTab} />
            ) : (
              <ul className="post-list" role="list">
                {feedEvents.map((ev) => (
                  <EventFeedCard key={ev.eventId} ev={ev} />
                ))}
              </ul>
            )
          ) : posts.length === 0 ? (
            <FeedEmpty tab={activeTab} />
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

      <div className="feed-fab-slot">
        <span className="feed-fab-label">Create Post</span>
        <button
          type="button"
          className="feed-create-fab"
          title={showCreate ? 'Close' : 'Create post'}
          aria-label={showCreate ? 'Close create panel' : 'Create post'}
          onClick={() => setShowCreate((v) => !v)}
        >
          <span aria-hidden className="feed-create-fab__plus">
            {showCreate ? '\u2715' : '+'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── EventFeedCard ─────────────────────────────────────────────────────────────

function EventFeedCard({ ev }: { ev: CampusEvent }) {
  const when = formatFeedDate(ev.startTime);
  return (
    <li className="post-card post-card--event-feed" aria-label={`Event: ${ev.title}`}>
      <div className="post-card__header">
        <div className="post-card__author">
          <span className="post-card__avatar" aria-hidden />
          <span className="post-card__user-label">Event</span>
          <time className="post-card__date" dateTime={ev.startTime}>
            <span className="post-card__date-text">{when}</span>
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

// ─── FeedEmpty ─────────────────────────────────────────────────────────────────

function FeedEmpty({ tab }: { tab: FeedCategory }) {
  const { title, detail } = emptyStateCopy(tab);
  return (
    <div className="feed-empty" role="status">
      <p className="feed-empty__title">{title}</p>
      <p className="feed-empty__detail">{detail}</p>
    </div>
  );
}

// ─── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onLike, onDelete }: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const when = formatFeedDate(post.createdAt);
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
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span className="post-card__avatar" aria-hidden />
          )}
          <span className="post-card__user-label">{post.authorName}</span>
          <time className="post-card__date" dateTime={post.createdAt}>
            <span className="post-card__date-text">{when}</span>
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
              aria-label={liked ? 'Unlike' : 'Like'}
              aria-pressed={liked}
            >
              <Heart size={18} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
            </button>
            {likeCount > 0 ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{likeCount}</span>
            ) : null}
            {post.authorId === currentUserId ? (
              <button
                type="button"
                className="post-card__icon-action"
                onClick={onDelete}
                aria-label="Delete post"
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="post-card__body">
        {post.type === 'events' && post.metadata?.title ? (
          <div className="post-event">
            <h4 className="post-event__title">{post.metadata.title}</h4>
            <div className="post-event__row">
              <MapPin className="post-event__icon" />
              <span>{post.metadata.location}</span>
            </div>
            <div className="post-event__row">
              <Calendar className="post-event__icon" />
              <span>
                {post.metadata.eventDate
                  ? new Date(post.metadata.eventDate).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : ''}
              </span>
            </div>
          </div>
        ) : null}

        <p className="post-card__content">{post.content}</p>

        {post.mediaUrl ? (
          <img src={post.mediaUrl} alt="Post attachment" className="post-card__media" />
        ) : null}
      </div>

      {commentsOpen ? (
        <CommentSection postId={post.postId} currentUserId={currentUserId} />
      ) : null}
    </li>
  );
}
