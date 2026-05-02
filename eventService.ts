/**
 * eventService.ts — Campus Connect
 * Public Feed Subsystem — Event Use Cases
 *
 * Implements all methods from the Event class in the DCD:
 *   + publish()                    : Boolean
 *   + cancel(reason: String)       : Boolean
 *   + rsvp(studentId: String)      : Boolean
 *   + getAttendees()               : List<Student>
 *
 * Covers FR18 (RSVP), FR8 (events as a feed type).
 */

import { supabase } from './supabaseClient';
import type { CampusEvent } from './index';
import type { Student } from './index';

// ─── Validation Helpers (exported for testing) ────────────────────────────────

export function isValidTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  return String(title).trim().length > 0;
}

/**
 * Returns true when dateStr is a parseable ISO string that is in the future.
 */
export function isValidFutureDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return false;
  return parsed > new Date();
}

/**
 * Returns true when capacity is a positive integer.
 */
export function isValidCapacity(capacity: number | null | undefined): boolean {
  if (capacity === null || capacity === undefined) return false;
  return Number.isInteger(capacity) && capacity > 0;
}

/** Default number of upcoming events shown beside the home feed. */
export const SIDEBAR_UPCOMING_EVENTS_LIMIT = 3;

/** Max upcoming events loaded for the Events tab (and search pool). */
export const EVENT_FEED_TAB_LIMIT = 200;

const MAX_EVENT_DESCRIPTION_LENGTH = 250;

// ─── publish() : Boolean ──────────────────────────────────────────────────────

/**
 * Pre-condition : organizerId is a valid authenticated user.
 *                 title and location are non-empty.
 *                 startTime is a future date.
 *                 capacity is a positive integer.
 * Post-condition: Event saved in the database. Returns the created CampusEvent.
 *
 * When `description` is passed, it is persisted as `events.description` (add a nullable
 * `description` text column in Supabase if missing). Omitted in tests / legacy callers.
 */
export async function publishEvent(
  organizerId: string,
  title: string,
  location: string,
  startTime: string,
  capacity: number,
  description?: string
): Promise<CampusEvent> {
  if (!organizerId || String(organizerId).trim() === '') {
    throw new Error('INVALID_ORGANIZER: organizerId is required.');
  }
  if (!isValidTitle(title)) {
    throw new Error('INVALID_TITLE: Event title cannot be empty.');
  }
  if (!location || String(location).trim() === '') {
    throw new Error('INVALID_LOCATION: Event location cannot be empty.');
  }
  if (!isValidFutureDate(startTime)) {
    throw new Error('INVALID_DATE: Event start time must be a valid future date.');
  }
  if (!isValidCapacity(capacity)) {
    throw new Error('INVALID_CAPACITY: Capacity must be a positive integer.');
  }

  if (description !== undefined) {
    const d = String(description).trim();
    if (!d) {
      throw new Error('INVALID_DESCRIPTION: Event description cannot be empty.');
    }
    if (d.length > MAX_EVENT_DESCRIPTION_LENGTH) {
      throw new Error(
        `DESCRIPTION_TOO_LONG: Description must be ${MAX_EVENT_DESCRIPTION_LENGTH} characters or fewer.`
      );
    }
  }

  const baseRow = {
    organizer_id: organizerId,
    title:        title.trim(),
    location:     location.trim(),
    start_time:   startTime,
    capacity,
    is_cancelled: false,
  };
  const row =
    description !== undefined
      ? { ...baseRow, description: String(description).trim() }
      : baseRow;

  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`PUBLISH_EVENT_ERROR: ${error.message}`);

  return mapToEvent(data as Record<string, unknown>);
}

// ─── upcoming list (feed sidebar & Events tab) ─────────────────────────────────

/**
 * Next `limit` non-cancelled events with start_time strictly in the future (≥ now UTC),
 * soonest first. Aligns with events created via Publish Event / Events tab (`events` table).
 */
export async function getNextUpcomingEvents(
  limit: number = SIDEBAR_UPCOMING_EVENTS_LIMIT
): Promise<CampusEvent[]> {
  const n =
    typeof limit === 'number' &&
    Number.isInteger(limit) &&
    limit >= 1 &&
    limit <= EVENT_FEED_TAB_LIMIT
      ? limit
      : SIDEBAR_UPCOMING_EVENTS_LIMIT;

  const nowISO = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_cancelled', false)
    .gte('start_time', nowISO)
    .order('start_time', { ascending: true })
    .limit(n);

  if (error) throw new Error(`LIST_UPCOMING_EVENTS_ERROR: ${error.message}`);
  return (data ?? []).map((row: unknown) =>
    mapToEvent(row as Record<string, unknown>)
  );
}

/**
 * Upcoming events whose title, location, or description contains the query (case-insensitive).
 * Uses a bounded load from `getNextUpcomingEvents` then filters in memory.
 */
export async function searchUpcomingEvents(
  query: string,
  maxResults: number = 50
): Promise<CampusEvent[]> {
  if (!query || String(query).trim() === '') {
    throw new Error('INVALID_QUERY: Search query cannot be empty.');
  }
  const q = query.trim().toLowerCase();
  const cap = Math.min(Math.max(maxResults, 1), EVENT_FEED_TAB_LIMIT);
  const pool = await getNextUpcomingEvents(EVENT_FEED_TAB_LIMIT);
  return pool
    .filter((e) => {
      const inTitle = e.title.toLowerCase().includes(q);
      const inLoc = e.location.toLowerCase().includes(q);
      const inDesc = (e.description ?? '').toLowerCase().includes(q);
      return inTitle || inLoc || inDesc;
    })
    .slice(0, cap);
}

// ─── cancel(reason) : Boolean ─────────────────────────────────────────────────

/**
 * Pre-condition : eventId exists. organizerId matches the event's organizer.
 *                 reason is a non-empty string.
 * Post-condition: Event marked as cancelled in the database. Returns true.
 */
export async function cancelEvent(
  eventId: string,
  organizerId: string,
  reason: string
): Promise<boolean> {
  if (!eventId || String(eventId).trim() === '') {
    throw new Error('INVALID_EVENT_ID: eventId is required.');
  }
  if (!reason || String(reason).trim() === '') {
    throw new Error('INVALID_REASON: Cancellation reason cannot be empty.');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('organizer_id, is_cancelled')
    .eq('id', eventId)
    .single();

  if (fetchError || !existing) throw new Error('EVENT_NOT_FOUND: Event does not exist.');
  if (existing.organizer_id !== organizerId) {
    throw new Error('UNAUTHORIZED: Only the organizer can cancel this event.');
  }
  if (existing.is_cancelled) {
    throw new Error('ALREADY_CANCELLED: This event is already cancelled.');
  }

  const { error } = await supabase
    .from('events')
    .update({ is_cancelled: true, cancel_reason: reason.trim() })
    .eq('id', eventId);

  if (error) throw new Error(`CANCEL_EVENT_ERROR: ${error.message}`);
  return true;
}

// ─── rsvp(studentId) : Boolean ────────────────────────────────────────────────

/**
 * Pre-condition : eventId exists, is not cancelled, and has remaining capacity.
 *                 studentId has not already RSVPed.
 * Post-condition: RSVP recorded in event_rsvps table. Returns true.
 */
export async function rsvpEvent(
  eventId: string,
  studentId: string
): Promise<boolean> {
  if (!eventId || String(eventId).trim() === '') {
    throw new Error('INVALID_EVENT_ID: eventId is required.');
  }
  if (!studentId || String(studentId).trim() === '') {
    throw new Error('INVALID_STUDENT_ID: studentId is required.');
  }

  // Fetch event to check status and capacity
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('capacity, is_cancelled')
    .eq('id', eventId)
    .single();

  if (fetchError || !event) throw new Error('EVENT_NOT_FOUND: Event does not exist.');
  if (event.is_cancelled) {
    throw new Error('EVENT_CANCELLED: Cannot RSVP to a cancelled event.');
  }

  // Count current RSVPs against capacity
  const { data: rsvps, error: countError } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('event_id', eventId);

  if (countError) throw new Error(`RSVP_ERROR: ${countError.message}`);
  if ((rsvps ?? []).length >= event.capacity) {
    throw new Error('EVENT_FULL: This event has reached its capacity.');
  }

  // Check for duplicate RSVP
  const { data: existingRsvp } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('student_id', studentId)
    .single();

  if (existingRsvp) throw new Error('ALREADY_RSVPED: You have already RSVPed to this event.');

  const { error } = await supabase.from('event_rsvps').insert({
    event_id:   eventId,
    student_id: studentId,
  });

  if (error) throw new Error(`RSVP_ERROR: ${error.message}`);
  return true;
}

// ─── getAttendees() : List<Student> ──────────────────────────────────────────

/**
 * Pre-condition : eventId exists.
 * Post-condition: Returns list of Student objects who RSVPed to the event.
 *                 Returns empty array if no attendees.
 */
export async function getAttendees(eventId: string): Promise<Student[]> {
  if (!eventId || String(eventId).trim() === '') {
    throw new Error('INVALID_EVENT_ID: eventId is required.');
  }

  // Verify event exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) throw new Error('EVENT_NOT_FOUND: Event does not exist.');

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('student:students(*)')
    .eq('event_id', eventId);

  if (error) throw new Error(`GET_ATTENDEES_ERROR: ${error.message}`);

  return (data ?? []).map((d: any) => ({
    studentId:    d.student.id,
    name:         d.student.name,
    email:        d.student.email,
    campus:       d.student.campus,
    major:        d.student.major,
    bio:          d.student.bio,
    avatarUrl:    d.student.avatar_url,
    passwordHash: '[redacted]',
  }));
}

// ─── Internal Mapper ──────────────────────────────────────────────────────────

function mapToEvent(d: Record<string, unknown>): CampusEvent {
  const r = d as {
    id: string;
    organizer_id: string;
    title: string;
    location: string;
    start_time: string;
    capacity: number;
    is_cancelled: boolean;
    cancel_reason?: string | null;
    description?: string | null;
  };
  return {
    eventId:      r.id,
    organizerId:  r.organizer_id,
    title:        r.title,
    location:     r.location,
    startTime:    r.start_time,
    capacity:     r.capacity,
    isCancelled:  r.is_cancelled,
    cancelReason: r.cancel_reason ?? undefined,
    description:  r.description != null && r.description !== '' ? r.description : undefined,
  };
}
