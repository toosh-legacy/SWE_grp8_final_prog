'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/index';
import { supabase } from '@/supabaseClient';
import { getPostsByAuthor } from '@/postService';
import {
  getPendingRequests,
  acceptConnection,
  declineConnection,
  getConnectionCount,
} from '@/connectionService';
import type { PendingRequest } from '@/connectionService';
import { useDashboardUserId } from './DashboardLayout';
import { useSettings } from '@/components/settings/settings-provider';

interface ProfileIdentity {
  displayName: string;
  username: string;
  email: string;
  campus: string;
  bio: string;
  avatarUrl: string;
}

const EMPTY_IDENTITY: ProfileIdentity = {
  displayName: '',
  username: '',
  email: '',
  campus: '',
  bio: '',
  avatarUrl: '',
};

interface RawProfile { username?: string; campus?: string; bio?: string; avatar_url?: string }
interface RawAuthUser { email?: string }

function deriveIdentity(profile: RawProfile | null, authUser: RawAuthUser | null): ProfileIdentity {
  const email = authUser?.email ?? '';
  const username = profile?.username ?? '';
  return {
    displayName: username || (email ? email.split('@')[0] : 'Student'),
    username,
    email,
    campus: profile?.campus ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: profile?.avatar_url ?? '',
  };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileView() {
  const userId = useDashboardUserId();
  const { settings } = useSettings();

  const [identity, setIdentity] = useState<ProfileIdentity>(EMPTY_IDENTITY);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) return;
      setLoading(true);
      setError('');

      try {
        const [authRes, profileRes, authorPosts, pending, count] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('profiles').select('*').eq('id', userId).single(),
          getPostsByAuthor(userId),
          getPendingRequests(userId),
          getConnectionCount(userId),
        ]);

        if (cancelled) return;
        if (profileRes.error) throw profileRes.error;

        setIdentity(deriveIdentity(profileRes.data, authRes.data?.user));
        setPosts(authorPosts);
        setPendingRequests(pending);
        setConnectionCount(count);
      } catch (err) {
        if (!cancelled) {
          console.error('Profile Load Error:', err);
          setError('Could not load profile information.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    const nextAvatar = settings.avatarDataUrl?.trim();
    if (!nextAvatar) return;
    setIdentity((prev) => {
      if (prev.avatarUrl === nextAvatar) return prev;
      return { ...prev, avatarUrl: nextAvatar };
    });
  }, [settings.avatarDataUrl]);

  async function handleAccept(req: PendingRequest) {
    try {
      await acceptConnection(req.connectionId);
      setPendingRequests((prev) => prev.filter((r) => r.connectionId !== req.connectionId));
      setConnectionCount((n) => n + 1);
    } catch {
      setError('Could not accept request.');
    }
  }

  async function handleDecline(req: PendingRequest) {
    try {
      await declineConnection(req.connectionId);
      setPendingRequests((prev) => prev.filter((r) => r.connectionId !== req.connectionId));
    } catch {
      setError('Could not decline request.');
    }
  }

  const profileDisplayName = settings.displayName.trim() || identity.displayName;
  const profileBio = settings.bio.trim() || identity.bio;
  const initials = useMemo(() => initialsOf(profileDisplayName), [profileDisplayName]);
  const subtitle = identity.username ? `@${identity.username}` : '';
  const profileAvatarUrl = settings.avatarDataUrl?.trim() || identity.avatarUrl;

  return (
    <div className="profile-page">
      <section className="profile-header" aria-labelledby="profile-name">
        <div className="profile-header__avatar" aria-hidden>
          {profileAvatarUrl ? (
            <img src={profileAvatarUrl} alt="" className="profile-header__avatar-img" />
          ) : (
            <span className="profile-header__avatar-initials">{initials}</span>
          )}
        </div>

        <div className="profile-header__identity">
          <h2 id="profile-name" className="profile-header__name">
            {profileDisplayName}
          </h2>
          {subtitle && <p className="profile-header__subtitle">{subtitle}</p>}

          {identity.campus && (
            <p className="profile-header__meta">
              <span aria-hidden className="profile-header__meta-icon">📍</span>
              {identity.campus}
            </p>
          )}

          {profileBio && <p className="profile-header__bio">{profileBio}</p>}

          <div className="profile-stats" role="list">
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">{posts.length}</span>
              <span className="profile-stat__label">Posts</span>
            </div>
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">{loading ? '—' : connectionCount}</span>
              <span className="profile-stat__label">Connections</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pending connection requests */}
      {pendingRequests.length > 0 && (
        <section className="connection-requests" aria-label="Pending connection requests">
          <header className="connection-requests__header">
            <h3 className="connection-requests__title">Connection Requests</h3>
            <span className="connection-requests__badge">{pendingRequests.length}</span>
          </header>
          <ul className="connection-requests__list" role="list">
            {pendingRequests.map((req) => (
              <li key={req.connectionId} className="connection-request-card">
                <Link href={`/users/${req.requesterId}`} className="connection-request-card__link">
                  <div className="connection-request-card__avatar" aria-hidden>
                    {req.requesterAvatar ? (
                      <img
                        src={req.requesterAvatar}
                        alt=""
                        className="connection-request-card__avatar-img"
                      />
                    ) : (
                      <span className="connection-request-card__avatar-initials">
                        {initialsOf(req.requesterName)}
                      </span>
                    )}
                  </div>
                  <span className="connection-request-card__name">{req.requesterName}</span>
                </Link>
                <div className="connection-request-card__actions">
                  <button
                    type="button"
                    className="btn-connect btn-connect--sm"
                    onClick={() => handleAccept(req)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn-connect btn-connect--decline btn-connect--sm"
                    onClick={() => handleDecline(req)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="profile-posts" aria-label="Your posts">
        <header className="profile-posts__header">
          <h3 className="profile-posts__title">Your Activity</h3>
          <span className="profile-posts__count">{posts.length}</span>
        </header>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {loading ? (
          <div className="feed-loading">Loading your library…</div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty__title">The archives are empty</p>
            <p className="feed-empty__detail">Share your first post to see it here.</p>
          </div>
        ) : (
          <ul className="post-list" role="list">
            {posts.map((post) => (
              <ProfilePostCard
                key={post.postId}
                post={post}
                authorName={profileDisplayName || post.authorName}
                authorPFP={profileAvatarUrl || post.authorPFP}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProfilePostCard({
  post,
  authorName,
  authorPFP,
}: {
  post: Post;
  authorName: string;
  authorPFP: string | null;
}) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <li className="post-card">
      <div className="post-card__header">
        <div className="post-card__author">
          {authorPFP ? (
            <img
              src={authorPFP}
              alt=""
              className="post-card__avatar-img"
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            />
          ) : (
            <span className="post-card__avatar" aria-hidden />
          )}
          <span className="post-card__user-label">{authorName}</span>
          <time className="post-card__date" dateTime={post.createdAt}>
            {formattedDate}
          </time>
        </div>
        <span className={`profile-post-tag profile-post-tag--${post.type}`}>{post.type}</span>
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
