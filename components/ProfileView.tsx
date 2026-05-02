'use client';

/**
 * ProfileView.tsx — Campus Connect
 * Updated to fetch identity from the 'public.profiles' table.
 */

import { useEffect, useMemo, useState } from 'react';
import type { Post } from '@/index';
import { supabase } from '@/supabaseClient';
import { getPostsByAuthor } from '@/postService';
import { useDashboardUserId } from './DashboardLayout';

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

/**
 * Maps the Database Profile and Auth User into a single Identity object.
 */
function deriveIdentity(profile: any, authUser: any): ProfileIdentity {
  const email = authUser?.email ?? '';
  const username = profile?.username ?? '';
  
  return {
    displayName: username || (email ? email.split('@')[0] : 'Student'),
    username: username,
    email: email,
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

  const [identity, setIdentity] = useState<ProfileIdentity>(EMPTY_IDENTITY);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      if (!userId) return;
      setLoading(true);
      setError('');

      try {
        // Fetch Auth User (for email) and Profile (for username/bio/pfp)
        const [authRes, profileRes, authorPosts] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('profiles').select('*').eq('id', userId).single(),
          getPostsByAuthor(userId),
        ]);

        if (cancelled) return;

        if (profileRes.error) throw profileRes.error;

        setIdentity(deriveIdentity(profileRes.data, authRes.data?.user));
        setPosts(authorPosts);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Profile Load Error:", err);
          setError('Could not load profile information.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const initials = useMemo(() => initialsOf(identity.displayName), [identity.displayName]);
  const subtitle = identity.username ? `@${identity.username}` : '';

  return (
    <div className="profile-page">
      <section className="profile-header" aria-labelledby="profile-name">
        <div className="profile-header__avatar" aria-hidden>
          {identity.avatarUrl ? (
            <img src={identity.avatarUrl} alt="" className="profile-header__avatar-img" />
          ) : (
            <span className="profile-header__avatar-initials">{initials}</span>
          )}
        </div>

        <div className="profile-header__identity">
          <h2 id="profile-name" className="profile-header__name">
            {identity.displayName}
          </h2>
          {subtitle && <p className="profile-header__subtitle">{subtitle}</p>}
          
          {identity.campus && (
            <p className="profile-header__meta">
              <span aria-hidden className="profile-header__meta-icon">📍</span>
              {identity.campus}
            </p>
          )}
          
          {identity.bio && <p className="profile-header__bio">{identity.bio}</p>}

          <div className="profile-stats" role="list">
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">{posts.length}</span>
              <span className="profile-stat__label">Posts</span>
            </div>
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">—</span>
              <span className="profile-stat__label">Connections</span>
            </div>
            <div className="profile-stat" role="listitem">
              <span className="profile-stat__value">—</span>
              <span className="profile-stat__label">Groups</span>
            </div>
          </div>
        </div>
      </section>

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
                // Use the data already in the post object (from our service join)
                authorName={post.authorName}
                authorPFP={post.authorPFP}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function ProfilePostCard({ post, authorName, authorPFP }: { post: Post; authorName: string; authorPFP: string | null }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <li className="post-card">
      <div className="post-card__header">
        <div className="post-card__author">
          {authorPFP ? (
            <img src={authorPFP} alt="" className="post-card__avatar-img" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
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
