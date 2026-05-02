'use client';

/**
 * HomeFeedPage.tsx — Campus Connect
 * Home route wrapper: passes session user id into the feed.
 *
 * Relies on DashboardLayout for auth; must render under that layout.
 */

import PostFeed from './PostFeed';
import { useDashboardUserId } from './DashboardLayout';

// ─── Component ─────────────────────────────────────────────────────────────────

export default function HomeFeedPage() {
  const userId = useDashboardUserId();
  return <PostFeed currentUserId={userId} />;
}
