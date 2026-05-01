'use client';

import PostFeed from './PostFeed';
import { useDashboardUserId } from './DashboardLayout';

export default function HomeFeedPage() {
  const userId = useDashboardUserId();
  return <PostFeed currentUserId={userId} />;
}
