/**
 * studyGroupService.ts — Campus Connect
 * CRUD for study groups and membership.
 */

import { supabase } from './supabaseClient';

export interface StudyGroupRecord {
  id: string;
  title: string;
  description: string;
  joinCode: string;
  creatorId: string;
  createdAt: string;
  memberCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateJoinCode(): string {
  return Array.from(
    { length: 6 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

/** Returns up to 3 initials from the group title for use as the icon. */
export function groupAbbreviation(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function mapRow(row: Record<string, unknown>): Omit<StudyGroupRecord, 'memberCount'> {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    joinCode: row.join_code as string,
    creatorId: row.creator_id as string,
    createdAt: row.created_at as string,
  };
}

async function getMemberCount(groupId: string): Promise<number> {
  const { count, error } = await supabase
    .from('study_group_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('group_id', groupId);
  if (error) return 0;
  return count ?? 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createStudyGroup(
  creatorId: string,
  title: string,
  description = ''
): Promise<StudyGroupRecord> {
  if (!title.trim()) throw new Error('Title is required');

  for (let attempt = 0; attempt < 3; attempt++) {
    const joinCode = generateJoinCode();
    const { data, error } = await supabase
      .from('study_groups')
      .insert({ title: title.trim(), description, join_code: joinCode, creator_id: creatorId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && attempt < 2) continue;
      throw error;
    }

    await supabase
      .from('study_group_members')
      .insert({ group_id: data.id, user_id: creatorId });

    return { ...mapRow(data as Record<string, unknown>), memberCount: 1 };
  }
  throw new Error('Could not generate a unique join code. Please try again.');
}

export async function joinStudyGroupByCode(
  userId: string,
  code: string
): Promise<StudyGroupRecord> {
  const normalised = code.trim().toUpperCase();

  const { data: group, error: gErr } = await supabase
    .from('study_groups')
    .select('*')
    .eq('join_code', normalised)
    .maybeSingle();

  if (gErr) throw gErr;
  if (!group) throw new Error('No group found with that code.');

  const row = group as Record<string, unknown>;

  const { error: mErr } = await supabase
    .from('study_group_members')
    .insert({ group_id: row.id, user_id: userId });

  if (mErr && mErr.code !== '23505') throw new Error('Could not join group.');

  const count = await getMemberCount(row.id as string);
  return { ...mapRow(row), memberCount: count };
}

export async function getMyGroups(userId: string): Promise<StudyGroupRecord[]> {
  const { data: memberships, error: mErr } = await supabase
    .from('study_group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (mErr) throw mErr;
  if (!memberships?.length) return [];

  const groupIds = (memberships as { group_id: string }[]).map((m) => m.group_id);

  const { data: groups, error: gErr } = await supabase
    .from('study_groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (gErr) throw gErr;
  if (!groups?.length) return [];

  const { data: allMembers, error: cErr } = await supabase
    .from('study_group_members')
    .select('group_id')
    .in('group_id', groupIds);

  if (cErr) throw cErr;

  const countMap = new Map<string, number>();
  for (const m of (allMembers ?? []) as { group_id: string }[]) {
    countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1);
  }

  return (groups as Record<string, unknown>[]).map((g) => ({
    ...mapRow(g),
    memberCount: countMap.get(g.id as string) ?? 1,
  }));
}

export async function getGroupById(groupId: string): Promise<StudyGroupRecord | null> {
  const { data, error } = await supabase
    .from('study_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error || !data) return null;
  const count = await getMemberCount(groupId);
  return { ...mapRow(data as Record<string, unknown>), memberCount: count };
}
