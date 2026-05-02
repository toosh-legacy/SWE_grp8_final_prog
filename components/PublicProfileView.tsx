'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/index';
import type { Connection } from '@/index';
import { supabase } from '@/supabaseClient';
import { getPostsByAuthor } from '@/postService';
import { useDashboardUserId } from './DashboardLayout';
import {
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  getConnectionBetween,
  getConnectionCount,
} from '@/connectionService';

interface PublicProfile {
  displayName: string;
  username: string;
  campus: string;
  bio: string;
  avatarUrl: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  targetUserId: string;
}

export default function PublicProfileView({ targetUserId }: Props) {
  const currentUserId = useDashboardUserId();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectBusy, setConnectBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, authorPosts, conn, count] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', targetUserId).single(),
          getPostsByAuthor(targetUserId),
          getConnectionBetween(currentUserId, targetUserId),
          getConnectionCount(targetUserId),
        ]);

        if (cancelled) return;
        if (profileRes.error) throw profileRes.error;

        const p = profileRes.data;
        setProfile({
          displayName: p?.username || 'Student',
          username: p?.username ?? '',
          campus: p?.campus ?? '',
          bio: p?.bio ?? '',
          avatarUrl: p?.avatar_url ?? '',
        });
        setPosts(authorPosts);
        setConnection(conn);
        setConnectionCount(count);
      } catch (err: any) {
        if (!cancelled) {
          console.error('PublicProfile load error:', err);
          setError('Could not load this profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUserId, targetUserId]);

  async function handleConnect() {
    setConnectBusy(true);
    setError('');
    try {
      const conn = await sendConnectionRequest(currentUserId, targetUserId);
      setConnection(conn);
    } catch (err: any) {
      setError('Could not send request. Try again.');
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleAccept() {
    if (!connection) return;
    setConnectBusy(true);
    try {
      await acceptConnection(connection.connectionId);
      setConnection({ ...connection, status: 'accepted' });
      setConnectionCount((n) => n + 1);
    } catch {
      setError('Could not accept request.');
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleDecline() {
    if (!connection) return;
    setConnectBusy(true);
    try {
      await declineConnection(connection.connectionId);
      setConnection(null);
    } catch {
      setError('Could not decline request.');
    } finally {
      setConnectBusy(false);
    }
  }

  const initials = useMemo(
    () => initialsOf(profile?.displayName ?? '?'),
    [profile?.displayName]
  );

  if (loading) {
    return <div className="feed-loading">Loading profile…</div>;
  }

  if (!profile) {
    return (
      <div className="feed-empty">
        <p className="feed-empty__title">Profile not found</p>
        <Link href="/home" className="public-profile__back">← Back to feed</Link>
      </div>
    );
  }

  // Determine which connect button(s) to render
  const iAmRequester = connection?.requesterId === currentUserId;
  const iAmReceiver = connection?.receiverId === currentUserId;

  let connectArea: React.ReactNode = null;
  if (!connection) {
    connectArea = (
      <button
        type="button"
        className="btn-connect"
        onClick={handleConnect}
        disabled={connectBusy}
      >
        {connectBusy ? 'Sending…' : 'Connect'}
      </button>
    );
  } else if (connection.status === 'pending' && iAmRequester) {
    connectArea = (
      <button type="button" className="btn-connect btn-connect--pending" disabled>
        Request Sent
      </button>
    );
  } else if (connection.status === 'pending' && iAmReceiver) {
    connectArea = (
      <div className="connect-respond">
        <button
          type="button"
          className="btn-connect"
          onClick={handleAccept}
          disabled={connectBusy}
        >
          Accept
        </button>
        <button
          type="button"
          className="btn-connect btn-connect--decline"
          onClick={handleDecline}
          disabled={connectBusy}
        >
          Decline
        </button>
      </div>
    );
  } else if (connection.status === 'accepted') {
    connectArea = (
      <span className="btn-connect btn-connect--connected" aria-label="You are connected">
        ✓ Connected
      </span>
    );
  }

  return (
    <div className="profile-page">
      <Link href="/home" className="public-profile__back">← Back to feed</Link>

      <section className="profile-header">
        <div className="profile-header__avatar" aria-hidden>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="profile-header__avatar-img" />
          ) : (
            <span className="profile-header__avatar-initials">{initials}</span>
          )}
        </div>

        <div className="profile-header__identity">
          <h2 className="profile-header__name">{profile.displayName}</h2>
          {profile.username && (
            <p className="profile-header__subtitle">@{profile.username}</p>
          )}
          {profile.campus && (
            <p className="profile-header__meta">
              <span aria-hidden className="profile-header__meta-icon">📍</span>
              {profile.campus}
            </p>
          )}
          {profile.bio && <p className="profile-header__bio">{profile.bio}</p>}

          <div className="profile-stats" role="list">
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">{posts.length}</span>
              <span className="profile-stat__label">Posts</span>
            </div>
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">{connectionCount}</span>
              <span className="profile-stat__label">Connections</span>
            </div>
          </div>

          {error && <p className="error-banner" role="alert">{error}</p>}

          <div className="profile-header__actions">
            {connectArea}
          </div>
        </div>
      </section>

      <section className="profile-posts" aria-label={`${profile.displayName}'s posts`}>
        <header className="profile-posts__header">
          <h3 className="profile-posts__title">Posts</h3>
          <span className="profile-posts__count">{posts.length}</span>
        </header>

        {posts.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty__title">No posts yet</p>
          </div>
        ) : (
          <ul className="post-list" role="list">
            {posts.map((post) => (
              <PublicPostCard key={post.postId} post={post} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PublicPostCard({ post }: { post: Post }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <li className="post-card">
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
            {formattedDate}
          </time>
        </div>
        <span className={`post-tag post-tag--${post.type}`}>{post.type}</span>
      </div>
      <div className="post-card__body">
        <p className="post-card__content">{post.content}</p>
        {post.mediaUrl && (
          <img src={post.mediaUrl} alt="Post attachment" className="post-card__media" />
        )}
      </div>
    </li>
  );
}
