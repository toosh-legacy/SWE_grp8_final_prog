"use client";

import StudyGroupsMessageView from "@/components/StudyGroupsMessageView";
import { supabase } from "@/supabaseClient";
import { getGroupById } from "@/studyGroupService";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { StudyGroupRecord } from "@/studyGroupService";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [group, setGroup] = useState<StudyGroupRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      getGroupById(id),
    ]).then(async ([authRes, groupData]) => {
      const u = authRes.data.user ?? null;
      setUser(u);
      setGroup(groupData);
      if (u) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', u.id)
          .single();
        setUsername((profile as { username?: string } | null)?.username || u.email || 'Unknown');
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="feed-loading">Loading…</div>;
  if (!user)  return <div className="error-banner">You must be logged in.</div>;
  if (!group) return <div className="error-banner">Group not found.</div>;

  return (
    <StudyGroupsMessageView
      userId={user.id}
      name={username}
      url="ws://127.0.0.1:9998"
      studyGroupId={id}
      group={{
        name: group.title,
        avatarUrl: null,
        memberCount: group.memberCount,
        onlineCount: 0,
      }}
    />
  );
}
