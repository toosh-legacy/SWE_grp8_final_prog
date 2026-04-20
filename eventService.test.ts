/**
 * eventService.test.ts — Campus Connect
 * Test Class: Public Feed — Event Use Cases (TypeScript)
 *
 * Framework: Vitest
 * Module:    src/services/eventService.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIG 20.13 — INPUT VALUE ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  publishEvent(organizerId, title, location, startTime, capacity)
 * ┌─────────────┬──────────┬──────────────────────────┬────────────────────────┬─────────────────────────┐
 * │ Variable    │ Type     │ Valid                    │ Invalid                │ Exceptional             │
 * ├─────────────┼──────────┼──────────────────────────┼────────────────────────┼─────────────────────────┤
 * │ organizerId │ string   │ valid user UUID          │ —                      │ null, ""                │
 * │ title       │ string   │ any non-empty string     │ whitespace only        │ null, ""                │
 * │ location    │ string   │ any non-empty string     │ whitespace only        │ null, ""                │
 * │ startTime   │ string   │ valid future ISO datetime│ past date, invalid str │ null, ""                │
 * │ capacity    │ number   │ positive integer (≥1)    │ 0, negative, float     │ null, undefined, NaN    │
 * └─────────────┴──────────┴──────────────────────────┴────────────────────────┴─────────────────────────┘
 *
 *  cancelEvent(eventId, organizerId, reason)
 * ┌─────────────┬────────┬──────────────────────────┬────────────────────────┬─────────────────────────┐
 * │ Variable    │ Type   │ Valid                    │ Invalid                │ Exceptional             │
 * ├─────────────┼────────┼──────────────────────────┼────────────────────────┼─────────────────────────┤
 * │ eventId     │ string │ existing event UUID      │ unknown UUID           │ null, ""                │
 * │ organizerId │ string │ UUID matching event owner│ different user UUID    │ null, ""                │
 * │ reason      │ string │ any non-empty string     │ whitespace only        │ null, ""                │
 * └─────────────┴────────┴──────────────────────────┴────────────────────────┴─────────────────────────┘
 *
 *  rsvpEvent(eventId, studentId)
 * ┌─────────────┬────────┬──────────────────────────┬──────────────────────────┬─────────────────────────┐
 * │ Variable    │ Type   │ Valid                    │ Invalid                  │ Exceptional             │
 * ├─────────────┼────────┼──────────────────────────┼──────────────────────────┼─────────────────────────┤
 * │ eventId     │ string │ existing, non-cancelled, │ cancelled event UUID,    │ null, ""                │
 * │             │        │ non-full event UUID      │ full event UUID          │                         │
 * │ studentId   │ string │ valid user UUID          │ already-RSVPed student   │ null, ""                │
 * └─────────────┴────────┴──────────────────────────┴──────────────────────────┴─────────────────────────┘
 *
 *  getAttendees(eventId)
 * ┌─────────────┬────────┬──────────────────────────┬──────────────────────┬─────────────────────────┐
 * │ Variable    │ Type   │ Valid                    │ Invalid              │ Exceptional             │
 * ├─────────────┼────────┼──────────────────────────┼──────────────────────┼─────────────────────────┤
 * │ eventId     │ string │ existing event UUID      │ unknown UUID         │ null, ""                │
 * └─────────────┴────────┴──────────────────────────┴──────────────────────┴─────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIG 20.14 — TEST CASE SCENARIOS (narrowed)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  publishEvent() — 7 scenarios, all coded
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ PE1  │ all valid fields → resolves → CampusEvent object                                       │
 * │ PE2  │ empty title → throws INVALID_TITLE                                                     │
 * │ PE3  │ empty location → throws INVALID_LOCATION                                               │
 * │ PE4  │ past date for startTime → throws INVALID_DATE                                          │
 * │ PE5  │ invalid date string → throws INVALID_DATE                                              │
 * │ PE6  │ capacity = 0 → throws INVALID_CAPACITY                                                 │
 * │ PE7  │ empty organizerId → throws INVALID_ORGANIZER                                           │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  cancelEvent() — 5 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ CE1  │ valid eventId + matching organizer + valid reason → resolves → true                    │
 * │ CE2  │ empty reason → throws INVALID_REASON                                                   │
 * │ CE3  │ unknown eventId → throws EVENT_NOT_FOUND                                               │
 * │ CE4  │ different organizerId → throws UNAUTHORIZED                                            │
 * │ CE5  │ already cancelled event → throws ALREADY_CANCELLED                                    │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  rsvpEvent() — 5 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ RE1  │ valid event (open, space available) + new student → resolves → true                   │
 * │ RE2  │ event is cancelled → throws EVENT_CANCELLED                                            │
 * │ RE3  │ event at full capacity → throws EVENT_FULL                                             │
 * │ RE4  │ student already RSVPed → throws ALREADY_RSVPED                                         │
 * │ RE5  │ empty eventId → throws INVALID_EVENT_ID                                                │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  getAttendees() — 3 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ GA1  │ valid eventId with attendees → resolves → Student[]                                    │
 * │ GA2  │ valid eventId with no RSVPs → resolves → []                                            │
 * │ GA3  │ unknown eventId → throws EVENT_NOT_FOUND                                               │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIG 20.15 — CONCRETE VALUES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  publishEvent()
 * ┌──────┬──────────────────┬───────────────────┬────────────────┬──────────────────────────┬──────┬──────────────────────────────────────┐
 * │ TC # │ organizerId      │ title             │ location       │ startTime                │ cap  │ Expected (concrete)                  │
 * ├──────┼──────────────────┼───────────────────┼────────────────┼──────────────────────────┼──────┼──────────────────────────────────────┤
 * │ PE1  │ "uuid-org-01"    │"CS Study Fair"    │"JSOM 2.803"    │"2099-06-01T14:00:00.000Z"│ 50   │ CampusEvent with eventId: "evt-001"  │
 * │ PE2  │ "uuid-org-01"    │ ""                │"JSOM 2.803"    │"2099-06-01T14:00:00.000Z"│ 50   │ Error includes "INVALID_TITLE"       │
 * │ PE3  │ "uuid-org-01"    │"CS Study Fair"    │ ""             │"2099-06-01T14:00:00.000Z"│ 50   │ Error includes "INVALID_LOCATION"    │
 * │ PE4  │ "uuid-org-01"    │"CS Study Fair"    │"JSOM 2.803"    │"2020-01-01T00:00:00.000Z"│ 50   │ Error includes "INVALID_DATE"        │
 * │ PE5  │ "uuid-org-01"    │"CS Study Fair"    │"JSOM 2.803"    │"not-a-date"              │ 50   │ Error includes "INVALID_DATE"        │
 * │ PE6  │ "uuid-org-01"    │"CS Study Fair"    │"JSOM 2.803"    │"2099-06-01T14:00:00.000Z"│ 0    │ Error includes "INVALID_CAPACITY"    │
 * │ PE7  │ ""               │"CS Study Fair"    │"JSOM 2.803"    │"2099-06-01T14:00:00.000Z"│ 50   │ Error includes "INVALID_ORGANIZER"   │
 * └──────┴──────────────────┴───────────────────┴────────────────┴──────────────────────────┴──────┴──────────────────────────────────────┘
 *
 *  rsvpEvent()
 * ┌──────┬──────────────────┬────────────────────────┬──────────────────────────────────────┐
 * │ TC # │ eventId          │ studentId              │ Expected (concrete)                  │
 * ├──────┼──────────────────┼────────────────────────┼──────────────────────────────────────┤
 * │ RE1  │ "evt-open-001"   │ "uuid-student-01"      │ true                                 │
 * │ RE2  │ "evt-cancelled"  │ "uuid-student-01"      │ Error includes "EVENT_CANCELLED"     │
 * │ RE3  │ "evt-full-001"   │ "uuid-student-02"      │ Error includes "EVENT_FULL"          │
 * │ RE4  │ "evt-open-001"   │ "uuid-already-rsvped"  │ Error includes "ALREADY_RSVPED"      │
 * │ RE5  │ ""               │ "uuid-student-01"      │ Error includes "INVALID_EVENT_ID"    │
 * └──────┴──────────────────┴────────────────────────┴──────────────────────────────────────┘
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  publishEvent,
  cancelEvent,
  rsvpEvent,
  getAttendees,
  isValidTitle,
  isValidFutureDate,
  isValidCapacity,
} from './eventService';

// ─── Supabase Mock ─────────────────────────────────────────────────────────────

vi.mock('../supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../supabaseClient';

/** Chainable, awaitable Supabase mock — same helper pattern as postService.test.ts */
function makeMock(result: { data?: any; error?: any }) {
  const chain: any = Object.assign(Promise.resolve(result), {
    select:  vi.fn(),
    insert:  vi.fn(),
    update:  vi.fn(),
    delete:  vi.fn(),
    eq:      vi.fn(),
    order:   vi.fn().mockResolvedValue(result),
    single:  vi.fn().mockResolvedValue(result),
  });

  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);

  return chain;
}

// Shared future date used across tests
const FUTURE_DATE = '2099-06-01T14:00:00.000Z';
const PAST_DATE   = '2020-01-01T00:00:00.000Z';

beforeEach(() => vi.clearAllMocks());

// =============================================================================
// Validation Helper Tests
// =============================================================================

describe('isValidTitle()', () => {
  it('returns true for a non-empty title', () => {
    expect(isValidTitle('CS Study Fair')).toBe(true);
  });
  it('returns false for an empty string', () => {
    expect(isValidTitle('')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isValidTitle(null)).toBe(false);
  });
});

describe('isValidFutureDate()', () => {
  it('returns true for a well-formed future ISO date', () => {
    expect(isValidFutureDate(FUTURE_DATE)).toBe(true);
  });
  it('returns false for a past ISO date', () => {
    expect(isValidFutureDate(PAST_DATE)).toBe(false);
  });
  it('returns false for an invalid date string', () => {
    expect(isValidFutureDate('not-a-date')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isValidFutureDate(null)).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isValidFutureDate('')).toBe(false);
  });
});

describe('isValidCapacity()', () => {
  it('returns true for a positive integer', () => {
    expect(isValidCapacity(50)).toBe(true);
  });
  it('returns true for exactly 1', () => {
    expect(isValidCapacity(1)).toBe(true);
  });
  it('returns false for 0', () => {
    expect(isValidCapacity(0)).toBe(false);
  });
  it('returns false for a negative number', () => {
    expect(isValidCapacity(-5)).toBe(false);
  });
  it('returns false for a float', () => {
    expect(isValidCapacity(3.14)).toBe(false);
  });
  it('returns false for null', () => {
    expect(isValidCapacity(null)).toBe(false);
  });
});

// =============================================================================
// publishEvent()
// =============================================================================

describe('publishEvent()', () => {
  const MOCK_EVENT_DB = {
    id:           'evt-001',
    organizer_id: 'uuid-org-01',
    title:        'CS Study Fair',
    location:     'JSOM 2.803',
    start_time:   FUTURE_DATE,
    capacity:     50,
    is_cancelled: false,
  };

  it('PE1 | all valid fields → resolves with CampusEvent object', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: MOCK_EVENT_DB, error: null })
    );

    const event = await publishEvent('uuid-org-01', 'CS Study Fair', 'JSOM 2.803', FUTURE_DATE, 50);

    expect(event.eventId).toBe('evt-001');
    expect(event.organizerId).toBe('uuid-org-01');
    expect(event.title).toBe('CS Study Fair');
    expect(event.location).toBe('JSOM 2.803');
    expect(event.capacity).toBe(50);
    expect(event.isCancelled).toBe(false);
  });

  it('PE2 | empty title → throws INVALID_TITLE (no Supabase call)', async () => {
    await expect(
      publishEvent('uuid-org-01', '', 'JSOM 2.803', FUTURE_DATE, 50)
    ).rejects.toThrow('INVALID_TITLE');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('PE3 | empty location → throws INVALID_LOCATION (no Supabase call)', async () => {
    await expect(
      publishEvent('uuid-org-01', 'CS Study Fair', '', FUTURE_DATE, 50)
    ).rejects.toThrow('INVALID_LOCATION');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('PE4 | past date → throws INVALID_DATE (no Supabase call)', async () => {
    await expect(
      publishEvent('uuid-org-01', 'CS Study Fair', 'JSOM 2.803', PAST_DATE, 50)
    ).rejects.toThrow('INVALID_DATE');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('PE5 | invalid date string → throws INVALID_DATE (no Supabase call)', async () => {
    await expect(
      publishEvent('uuid-org-01', 'CS Study Fair', 'JSOM 2.803', 'not-a-date', 50)
    ).rejects.toThrow('INVALID_DATE');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('PE6 | capacity = 0 → throws INVALID_CAPACITY (no Supabase call)', async () => {
    await expect(
      publishEvent('uuid-org-01', 'CS Study Fair', 'JSOM 2.803', FUTURE_DATE, 0)
    ).rejects.toThrow('INVALID_CAPACITY');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('PE7 | empty organizerId → throws INVALID_ORGANIZER (no Supabase call)', async () => {
    await expect(
      publishEvent('', 'CS Study Fair', 'JSOM 2.803', FUTURE_DATE, 50)
    ).rejects.toThrow('INVALID_ORGANIZER');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// cancelEvent()
// =============================================================================

describe('cancelEvent()', () => {
  it('CE1 | valid eventId + matching organizer + valid reason → resolves with true', async () => {
    vi.mocked(supabase.from)
      // Ownership/status check
      .mockReturnValueOnce(
        makeMock({ data: { organizer_id: 'uuid-org-01', is_cancelled: false }, error: null })
      )
      // Update call
      .mockReturnValueOnce(makeMock({ data: null, error: null }));

    const result = await cancelEvent('evt-001', 'uuid-org-01', 'Venue unavailable');

    expect(result).toBe(true);
  });

  it('CE2 | empty reason → throws INVALID_REASON (no Supabase call)', async () => {
    await expect(
      cancelEvent('evt-001', 'uuid-org-01', '')
    ).rejects.toThrow('INVALID_REASON');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('CE3 | unknown eventId → throws EVENT_NOT_FOUND', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: null, error: { message: 'Row not found' } })
    );

    await expect(
      cancelEvent('unknown-evt', 'uuid-org-01', 'Venue unavailable')
    ).rejects.toThrow('EVENT_NOT_FOUND');
  });

  it('CE4 | different organizerId → throws UNAUTHORIZED', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: { organizer_id: 'uuid-someone-else', is_cancelled: false }, error: null })
    );

    await expect(
      cancelEvent('evt-001', 'uuid-org-01', 'Venue unavailable')
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('CE5 | event already cancelled → throws ALREADY_CANCELLED', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: { organizer_id: 'uuid-org-01', is_cancelled: true }, error: null })
    );

    await expect(
      cancelEvent('evt-001', 'uuid-org-01', 'Double cancel attempt')
    ).rejects.toThrow('ALREADY_CANCELLED');
  });
});

// =============================================================================
// rsvpEvent()
// =============================================================================

describe('rsvpEvent()', () => {
  it('RE1 | open event with space + new student → resolves with true', async () => {
    vi.mocked(supabase.from)
      // Event status check
      .mockReturnValueOnce(
        makeMock({ data: { capacity: 50, is_cancelled: false }, error: null })
      )
      // Current RSVP count (5 out of 50)
      .mockReturnValueOnce(
        makeMock({ data: Array(5).fill({ event_id: 'evt-open-001' }), error: null })
      )
      // Duplicate RSVP check (not found)
      .mockReturnValueOnce(
        makeMock({ data: null, error: { message: 'Not found' } })
      )
      // RSVP insert
      .mockReturnValueOnce(makeMock({ data: null, error: null }));

    const result = await rsvpEvent('evt-open-001', 'uuid-student-01');

    expect(result).toBe(true);
  });

  it('RE2 | cancelled event → throws EVENT_CANCELLED', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: { capacity: 50, is_cancelled: true }, error: null })
    );

    await expect(rsvpEvent('evt-cancelled', 'uuid-student-01')).rejects.toThrow('EVENT_CANCELLED');
  });

  it('RE3 | event at full capacity → throws EVENT_FULL', async () => {
    vi.mocked(supabase.from)
      // Event check
      .mockReturnValueOnce(
        makeMock({ data: { capacity: 2, is_cancelled: false }, error: null })
      )
      // Current RSVPs = 2 (at capacity)
      .mockReturnValueOnce(
        makeMock({ data: [{ event_id: 'evt-full-001' }, { event_id: 'evt-full-001' }], error: null })
      );

    await expect(rsvpEvent('evt-full-001', 'uuid-student-02')).rejects.toThrow('EVENT_FULL');
  });

  it('RE4 | student already RSVPed → throws ALREADY_RSVPED', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeMock({ data: { capacity: 50, is_cancelled: false }, error: null })
      )
      .mockReturnValueOnce(
        makeMock({ data: [{ event_id: 'evt-open-001' }], error: null })
      )
      // Duplicate check returns existing record
      .mockReturnValueOnce(
        makeMock({ data: { event_id: 'evt-open-001' }, error: null })
      );

    await expect(
      rsvpEvent('evt-open-001', 'uuid-already-rsvped')
    ).rejects.toThrow('ALREADY_RSVPED');
  });

  it('RE5 | empty eventId → throws INVALID_EVENT_ID (no Supabase call)', async () => {
    await expect(rsvpEvent('', 'uuid-student-01')).rejects.toThrow('INVALID_EVENT_ID');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// getAttendees()
// =============================================================================

describe('getAttendees()', () => {
  const MOCK_RSVP_ROWS = [
    {
      student: {
        id: 'uuid-s1', name: 'Alice', email: 'alice@utdallas.edu',
        campus: 'UTD', major: 'CS', bio: '', avatar_url: '',
      },
    },
    {
      student: {
        id: 'uuid-s2', name: 'Bob', email: 'bob@utdallas.edu',
        campus: 'UTD', major: 'EE', bio: '', avatar_url: '',
      },
    },
  ];

  it('GA1 | valid eventId with attendees → resolves with Student array', async () => {
    vi.mocked(supabase.from)
      // Event existence check
      .mockReturnValueOnce(makeMock({ data: { id: 'evt-001' }, error: null }))
      // RSVP join query
      .mockReturnValueOnce(makeMock({ data: MOCK_RSVP_ROWS, error: null }));

    const attendees = await getAttendees('evt-001');

    expect(Array.isArray(attendees)).toBe(true);
    expect(attendees).toHaveLength(2);
    expect(attendees[0].studentId).toBe('uuid-s1');
    expect(attendees[0].name).toBe('Alice');
    expect(attendees[0].email).toBe('alice@utdallas.edu');
    expect(attendees[1].studentId).toBe('uuid-s2');
  });

  it('GA2 | valid eventId with no RSVPs → resolves with empty array', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeMock({ data: { id: 'evt-empty' }, error: null }))
      .mockReturnValueOnce(makeMock({ data: [], error: null }));

    const attendees = await getAttendees('evt-empty');

    expect(Array.isArray(attendees)).toBe(true);
    expect(attendees).toHaveLength(0);
  });

  it('GA3 | unknown eventId → throws EVENT_NOT_FOUND', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: null, error: { message: 'Row not found' } })
    );

    await expect(getAttendees('unknown-evt-id')).rejects.toThrow('EVENT_NOT_FOUND');
  });
});
