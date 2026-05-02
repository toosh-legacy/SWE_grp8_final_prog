"use client";

import StudyGroupsMessageView from "@/components/StudyGroupsMessageView";
import { supabase } from "@/supabaseClient";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const { data, error } = res;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You must be logged in</div>;
  }

  return (
    <StudyGroupsMessageView
      userId={user.id}
      name={user.email ?? "unknown"}
      url="ws://127.0.0.1:9998"
      studyGroupId={id}
      group={{
        name: id,
        avatarUrl: null,
        memberCount: 12,
        onlineCount: 0,
      }}
    />
  );
}