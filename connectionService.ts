/**
 * connectionService.ts — Campus Connect
 * Handles connection requests between students.
 */

import { supabase } from './supabaseClient';
import type { Connection } from './index';

export interface PendingRequest {
  connectionId: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string | null;
  createdAt: string;
}

export async function sendConnectionRequest(
  requesterId: string,
  receiverId: string
): Promise<Connection> {
  const { data, error } = await supabase
    .from('connections')
    .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function acceptConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId);
  if (error) throw error;
}

export async function declineConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);
  if (error) throw error;
}

export async function getConnectionBetween(
  userId: string,
  otherId: string
): Promise<Connection | null> {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(
      `and(requester_id.eq.${userId},receiver_id.eq.${otherId}),` +
      `and(requester_id.eq.${otherId},receiver_id.eq.${userId})`
    )
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function getConnectionCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');
  if (error) throw error;
  return count ?? 0;
}

export async function getPendingRequests(userId: string): Promise<PendingRequest[]> {
  const { data: rows, error } = await supabase
    .from('connections')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!rows?.length) return [];

  const ids: string[] = rows.map((r: any) => r.requester_id);
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);
  if (pErr) throw pErr;

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return rows.map((r: any) => ({
    connectionId: r.id,
    requesterId: r.requester_id,
    requesterName: profileMap.get(r.requester_id)?.username ?? 'Unknown User',
    requesterAvatar: profileMap.get(r.requester_id)?.avatar_url ?? null,
    createdAt: r.created_at,
  }));
}

function mapRow(row: any): Connection {
  return {
    connectionId: row.id,
    requesterId: row.requester_id,
    receiverId: row.receiver_id,
    status: row.status,
    createdAt: row.created_at,
  };
}
