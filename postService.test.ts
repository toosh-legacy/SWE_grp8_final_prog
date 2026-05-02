/**
 * postService.test.ts — Campus Connect
 * Test Class: Public Feed — Post Use Cases (TypeScript)
 *
 * Framework: Vitest
 * Module:    src/services/postService.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIG 20.13 — INPUT VALUE ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  createPost(authorId, content, type)
 * ┌──────────┬────────────┬──────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable │ Type       │ Valid                    │ Invalid              │ Exceptional              │
 * ├──────────┼────────────┼──────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ authorId │ string     │ valid UUID               │ random string        │ null, undefined, ""      │
 * │ content  │ string     │ 1–250 chars              │ 251+ chars           │ null, undefined, ""      │
 * │ type     │ FeedCat.   │ "general"|"announcement" │ "event","unknown"…   │ null, undefined, ""      │
 * └──────────┴────────────┴──────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 *  editPost(postId, authorId, newContent)
 * ┌──────────────┬────────┬──────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable     │ Type   │ Valid                    │ Invalid              │ Exceptional              │
 * ├──────────────┼────────┼──────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ postId       │ string │ existing post UUID       │ unknown post UUID    │ null, ""                 │
 * │ authorId     │ string │ UUID matching post.author│ different user UUID  │ null, ""                 │
 * │ newContent   │ string │ 1–250 chars              │ 251+ chars           │ null, ""                 │
 * └──────────────┴────────┴──────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 *  deletePost(postId, authorId)
 * ┌──────────┬────────┬──────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable │ Type   │ Valid                    │ Invalid              │ Exceptional              │
 * ├──────────┼────────┼──────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ postId   │ string │ existing post UUID       │ unknown post UUID    │ null, ""                 │
 * │ authorId │ string │ UUID matching author     │ different user UUID  │ null, ""                 │
 * └──────────┴────────┴──────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 *  likePost(postId, studentId)
 * ┌──────────────┬────────┬──────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable     │ Type   │ Valid                    │ Invalid              │ Exceptional              │
 * ├──────────────┼────────┼──────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ postId       │ string │ existing post UUID       │ —                    │ null, ""                 │
 * │ studentId    │ string │ valid user UUID          │ (same as postId)     │ null, ""                 │
 * └──────────────┴────────┴──────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 *  addComment(postId, authorId, content)
 * ┌──────────┬────────┬──────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable │ Type   │ Valid                    │ Invalid              │ Exceptional              │
 * ├──────────┼────────┼──────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ postId   │ string │ existing post UUID       │ unknown post UUID    │ null, ""                 │
 * │ authorId │ string │ valid user UUID          │ —                    │ null, ""                 │
 * │ content  │ string │ non-empty string         │ only whitespace      │ null, ""                 │
 * └──────────┴────────┴──────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 *  getFeedByCategory(category)
 * ┌──────────┬────────┬────────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable │ Type   │ Valid                      │ Invalid              │ Exceptional              │
 * ├──────────┼────────┼────────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ category │ string │ "general","announcement",  │ "sports","unknown"   │ null, ""                 │
 * │          │        │ "event"                    │                      │                          │
 * └──────────┴────────┴────────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 *  searchFeed(query, category?)
 * ┌──────────┬────────┬──────────────────────────┬──────────────────────┬──────────────────────────┐
 * │ Variable │ Type   │ Valid                    │ Invalid              │ Exceptional              │
 * ├──────────┼────────┼──────────────────────────┼──────────────────────┼──────────────────────────┤
 * │ query    │ string │ any non-empty string     │ —                    │ null, ""                 │
 * │ category │ string │ valid FeedCategory|undef │ invalid category str │ null                     │
 * └──────────┴────────┴──────────────────────────┴──────────────────────┴──────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIG 20.14 — TEST CASE SCENARIOS (narrowed)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  createPost() — 7 scenarios, all coded
 * ┌──────┬────────────────────────┬────────────────────────┬───────────────────────────────────────┐
 * │ TC # │ Input Summary          │ Type                   │ Expected Output                       │
 * ├──────┼────────────────────────┼────────────────────────┼───────────────────────────────────────┤
 * │ CP1  │ valid all fields       │ general                │ resolves → Post object                │
 * │ CP2  │ valid authorId/type    │ —                      │ empty content → throws INVALID_CONTENT│
 * │ CP3  │ valid authorId/type    │ —                      │ 251-char content → CONTENT_TOO_LONG   │
 * │ CP4  │ valid authorId/content │ "sports"               │ throws INVALID_TYPE                   │
 * │ CP5  │ "" authorId            │ general                │ throws INVALID_AUTHOR                 │
 * │ CP6  │ null content           │ general                │ throws INVALID_CONTENT                │
 * │ CP7  │ valid                  │ "event"                │ throws INVALID_TYPE (events use events table) │
 * └──────┴────────────────────────┴────────────────────────┴───────────────────────────────────────┘
 *
 *  editPost() — 4 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ EP1  │ valid postId + matching author + valid content → resolves → true                       │
 * │ EP2  │ empty content → throws INVALID_CONTENT                                                 │
 * │ EP3  │ unknown postId → throws POST_NOT_FOUND                                                 │
 * │ EP4  │ different authorId than post owner → throws UNAUTHORIZED                               │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  deletePost() — 3 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ DP1  │ valid postId + matching author → resolves → true                                       │
 * │ DP2  │ unknown postId → throws POST_NOT_FOUND                                                 │
 * │ DP3  │ different authorId → throws UNAUTHORIZED                                               │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  likePost() — 4 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ LP1  │ valid postId + studentId, not yet liked → resolves → true                             │
 * │ LP2  │ student already liked this post → unlike → resolves → false                            │
 * │ LP3  │ empty postId → throws INVALID_POST_ID                                                  │
 * │ LP4  │ empty studentId → throws INVALID_STUDENT_ID                                            │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  addComment() — 3 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ AC1  │ valid postId + authorId + content → resolves → Comment object                         │
 * │ AC2  │ empty content → throws INVALID_CONTENT                                                 │
 * │ AC3  │ unknown postId → throws POST_NOT_FOUND                                                 │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  getFeedByCategory() — 3 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ GF1  │ category = "general" → resolves → Post[]                                               │
 * │ GF2  │ category = "sports" (invalid) → throws INVALID_CATEGORY                                │
 * │ GF3  │ category = "event" → throws INVALID_CATEGORY (events not in posts)                      │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 *  searchFeed() — 4 scenarios
 * ┌──────┬─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ TC # │ Scenario → Expected Output                                                              │
 * ├──────┼─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ SF1  │ valid query → resolves → matching Post[]                                                │
 * │ SF2  │ empty query → throws INVALID_QUERY                                                      │
 * │ SF3  │ valid query, no matches → resolves → []                                                 │
 * │ SF4  │ category = "event" → throws INVALID_CATEGORY                                            │
 * └──────┴─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIG 20.15 — CONCRETE VALUES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  createPost()
 * ┌──────┬────────────────────────┬─────────────────────────────┬────────────────┬────────────────────────────────────────────┐
 * │ TC # │ authorId               │ content                     │ type           │ Expected (concrete)                        │
 * ├──────┼────────────────────────┼─────────────────────────────┼────────────────┼────────────────────────────────────────────┤
 * │ CP1  │ "uuid-author-01"       │ "Study session at SU!"      │ "general"      │ Post with postId:"post-id-001"             │
 * │ CP2  │ "uuid-author-01"       │ ""                          │ "general"      │ Error includes "INVALID_CONTENT"           │
 * │ CP3  │ "uuid-author-01"       │ "a".repeat(251)             │ "general"      │ Error includes "CONTENT_TOO_LONG"          │
 * │ CP4  │ "uuid-author-01"       │ "Hello campus!"             │ "sports"       │ Error includes "INVALID_TYPE"              │
 * │ CP5  │ ""                     │ "Hello campus!"             │ "general"      │ Error includes "INVALID_AUTHOR"            │
 * │ CP6  │ "uuid-author-01"       │ null                        │ "general"      │ Error includes "INVALID_CONTENT"           │
 * │ CP7  │ "uuid-author-01"       │ "Tech Talk @ UTD this Fri!" │ "event"        │ Error includes "INVALID_TYPE"              │
 * └──────┴────────────────────────┴─────────────────────────────┴────────────────┴────────────────────────────────────────────┘
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPost,
  editPost,
  deletePost,
  likePost,
  addComment,
  getCommentsForPost,
  getFeedByCategory,
  searchFeed,
  isValidContent,
  isWithinPostLimit,
  isValidCategory,
  MAX_POST_LENGTH,
  MAX_COMMENT_LENGTH,
} from './postService';

// ─── Supabase Mock ─────────────────────────────────────────────────────────────

vi.mock('./supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from './supabaseClient';

/**
 * Builds a Supabase-like chainable mock that:
 * - Returns `this` on all builder methods (select, eq, ilike, order, update, delete, insert)
 * - Resolves to `result` on `single()`, `maybeSingle()`, and `order()` terminal calls
 * - Is itself a Promise resolving to `result` (handles direct awaits)
 */
function makeMock(result: { data?: any; error?: any }) {
  const chain: any = Object.assign(Promise.resolve(result), {
    select:  vi.fn(),
    insert:  vi.fn(),
    update:  vi.fn(),
    delete:  vi.fn(),
    eq:      vi.fn(),
    ilike:   vi.fn(),
    order:        vi.fn().mockResolvedValue(result),
    single:       vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  });

  // All builder methods return the same chain
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.ilike.mockReturnValue(chain);

  return chain;
}

beforeEach(() => vi.clearAllMocks());

// =============================================================================
// Validation Helper Tests
// =============================================================================

describe('isValidContent()', () => {
  it('returns true for a non-empty string', () => {
    expect(isValidContent('hello')).toBe(true);
  });
  it('returns false for an empty string', () => {
    expect(isValidContent('')).toBe(false);
  });
  it('returns false for a whitespace-only string', () => {
    expect(isValidContent('   ')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isValidContent(null)).toBe(false);
  });
  it('returns false for undefined', () => {
    expect(isValidContent(undefined)).toBe(false);
  });
});

describe('isWithinPostLimit()', () => {
  it('returns true for content at exactly 250 chars', () => {
    expect(isWithinPostLimit('a'.repeat(250))).toBe(true);
  });
  it('returns false for content at 251 chars', () => {
    expect(isWithinPostLimit('a'.repeat(251))).toBe(false);
  });
  it('returns true for a short string', () => {
    expect(isWithinPostLimit('Hello!')).toBe(true);
  });
});

describe('isValidCategory()', () => {
  it('returns true for "general"', () => {
    expect(isValidCategory('general')).toBe(true);
  });
  it('returns true for "announcement"', () => {
    expect(isValidCategory('announcement')).toBe(true);
  });
  it('returns true for "events"', () => {
    expect(isValidCategory('events')).toBe(true);
  });
  it('returns false for "sports"', () => {
    expect(isValidCategory('sports')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isValidCategory(null)).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isValidCategory('')).toBe(false);
  });
});

// =============================================================================
// createPost()
// =============================================================================

describe('createPost()', () => {
  const MOCK_POST_DB = {
    id:         'post-id-001',
    user_id:    'uuid-author-01',
    content:    'Study session at SU!',
    media_url:  null,
    section:    'general',
    created_at: '2026-04-19T10:00:00.000Z',
  };

  it('CP1 | valid all fields (general) → resolves with Post object', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: MOCK_POST_DB, error: null })
    );

    const post = await createPost('uuid-author-01', 'Study session at SU!', 'general');

    expect(post.postId).toBe('post-id-001');
    expect(post.authorId).toBe('uuid-author-01');
    expect(post.content).toBe('Study session at SU!');
    expect(post.type).toBe('general');
    expect(post.mediaUrl).toBeNull();
    expect(typeof post.createdAt).toBe('string');
  });

  it('CP2 | empty content → throws INVALID_CONTENT (no Supabase call)', async () => {
    await expect(createPost('uuid-author-01', '', 'general')).rejects.toThrow('INVALID_CONTENT');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('CP3 | 251-char content → throws CONTENT_TOO_LONG (no Supabase call)', async () => {
    await expect(
      createPost('uuid-author-01', 'a'.repeat(MAX_POST_LENGTH + 1), 'general')
    ).rejects.toThrow('CONTENT_TOO_LONG');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('CP4 | invalid type "sports" → throws INVALID_TYPE (no Supabase call)', async () => {
    await expect(
      createPost('uuid-author-01', 'Hello campus!', 'sports' as any)
    ).rejects.toThrow('INVALID_TYPE');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('CP5 | empty authorId → throws INVALID_AUTHOR (no Supabase call)', async () => {
    await expect(createPost('', 'Hello campus!', 'general')).rejects.toThrow('INVALID_AUTHOR');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('CP6 | null content → throws INVALID_CONTENT (no Supabase call)', async () => {
    await expect(
      createPost('uuid-author-01', null as any, 'general')
    ).rejects.toThrow('INVALID_CONTENT');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('CP7 | valid fields, type = "event" → throws INVALID_TYPE (no posts row)', async () => {
    await expect(
      createPost(
        'uuid-author-01',
        'Tech Talk @ UTD this Fri!',
        'event' as unknown as Parameters<typeof createPost>[2]
      )
    ).rejects.toThrow('INVALID_TYPE');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// editPost()
// =============================================================================

describe('editPost()', () => {
  it('EP1 | valid postId + matching author + valid content → resolves with true', async () => {
    // First call: fetch ownership check
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeMock({ data: { user_id: 'uuid-author-01' }, error: null }))
      // Second call: update
      .mockReturnValueOnce(makeMock({ data: null, error: null }));

    const result = await editPost('post-id-001', 'uuid-author-01', 'Updated content!');

    expect(result).toBe(true);
  });

  it('EP2 | empty newContent → throws INVALID_CONTENT (no Supabase call)', async () => {
    await expect(
      editPost('post-id-001', 'uuid-author-01', '')
    ).rejects.toThrow('INVALID_CONTENT');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('EP3 | unknown postId → throws POST_NOT_FOUND', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: null, error: { message: 'Row not found' } })
    );

    await expect(
      editPost('unknown-post-id', 'uuid-author-01', 'Updated content!')
    ).rejects.toThrow('POST_NOT_FOUND');
  });

  it('EP4 | different authorId → throws UNAUTHORIZED', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: { user_id: 'uuid-different-author' }, error: null })
    );

    await expect(
      editPost('post-id-001', 'uuid-author-01', 'Updated content!')
    ).rejects.toThrow('UNAUTHORIZED');
  });
});

// =============================================================================
// deletePost()
// =============================================================================

describe('deletePost()', () => {
  it('DP1 | valid postId + matching author → resolves with true', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeMock({ data: { user_id: 'uuid-author-01' }, error: null }))
      .mockReturnValueOnce(makeMock({ data: null, error: null }));

    const result = await deletePost('post-id-001', 'uuid-author-01');

    expect(result).toBe(true);
  });

  it('DP2 | unknown postId → throws POST_NOT_FOUND', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: null, error: { message: 'Row not found' } })
    );

    await expect(deletePost('unknown-id', 'uuid-author-01')).rejects.toThrow('POST_NOT_FOUND');
  });

  it('DP3 | different authorId → throws UNAUTHORIZED', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: { user_id: 'uuid-someone-else' }, error: null })
    );

    await expect(deletePost('post-id-001', 'uuid-author-01')).rejects.toThrow('UNAUTHORIZED');
  });
});

// =============================================================================
// likePost()
// =============================================================================

describe('likePost()', () => {
  it('LP1 | valid postId + studentId, not yet liked → resolves with true', async () => {
    // First call: check existing like (none — maybeSingle resolves with null row)
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeMock({ data: null, error: null }))
      // Second call: insert like
      .mockReturnValueOnce(makeMock({ data: null, error: null }));

    const result = await likePost('post-id-001', 'uuid-student-01');

    expect(result).toBe(true);
  });

  it('LP2 | post already liked → unlike → resolves with false', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        makeMock({ data: { post_id: 'post-id-001' }, error: null })
      )
      .mockReturnValueOnce(makeMock({ data: null, error: null }));

    const result = await likePost('post-id-001', 'uuid-student-01');

    expect(result).toBe(false);
  });

  it('LP3 | empty postId → throws INVALID_POST_ID (no Supabase call)', async () => {
    await expect(likePost('', 'uuid-student-01')).rejects.toThrow('INVALID_POST_ID');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('LP4 | empty studentId → throws INVALID_STUDENT_ID (no Supabase call)', async () => {
    await expect(likePost('post-id-001', '')).rejects.toThrow('INVALID_STUDENT_ID');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// addComment()
// =============================================================================

describe('addComment()', () => {
  const MOCK_COMMENT_DB = {
    id:         'comment-id-001',
    post_id:    'post-id-001',
    user_id:    'uuid-author-01',
    content:    'Great post!',
    created_at: '2026-04-19T11:00:00.000Z',
  };

  it('AC1 | valid inputs → resolves with Comment object', async () => {
    vi.mocked(supabase.from)
      // Post existence check
      .mockReturnValueOnce(makeMock({ data: { id: 'post-id-001' }, error: null }))
      // Comment insert
      .mockReturnValueOnce(makeMock({ data: MOCK_COMMENT_DB, error: null }));

    const comment = await addComment('post-id-001', 'uuid-author-01', 'Great post!');

    expect(comment.commentId).toBe('comment-id-001');
    expect(comment.postId).toBe('post-id-001');
    expect(comment.content).toBe('Great post!');
    expect(comment.authorId).toBe('uuid-author-01');
    expect(typeof comment.createdAt).toBe('string');
  });

  it('AC2 | empty content → throws INVALID_CONTENT (no Supabase call)', async () => {
    await expect(
      addComment('post-id-001', 'uuid-author-01', '')
    ).rejects.toThrow('INVALID_CONTENT');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('AC3 | unknown postId → throws POST_NOT_FOUND', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: null, error: { message: 'Row not found' } })
    );

    await expect(
      addComment('unknown-post-id', 'uuid-author-01', 'Great post!')
    ).rejects.toThrow('POST_NOT_FOUND');
  });

  it('AC4 | empty authorId → throws INVALID_AUTHOR (no Supabase call)', async () => {
    await expect(
      addComment('post-id-001', '', 'Great post!')
    ).rejects.toThrow('INVALID_AUTHOR');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('AC5 | content over MAX_COMMENT_LENGTH → throws COMMENT_TOO_LONG', async () => {
    await expect(
      addComment('post-id-001', 'uuid-author-01', 'x'.repeat(MAX_COMMENT_LENGTH + 1))
    ).rejects.toThrow('COMMENT_TOO_LONG');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// getCommentsForPost()
// =============================================================================

describe('getCommentsForPost()', () => {
  it('GC1 | valid postId → resolves with Comment[]', async () => {
    const rows = [
      {
        id: 'c1',
        post_id: 'post-id-001',
        user_id: 'uuid-a',
        content: 'First',
        created_at: '2026-04-19T10:00:00.000Z',
      },
      {
        id: 'c2',
        post_id: 'post-id-001',
        user_id: 'uuid-b',
        content: 'Second',
        created_at: '2026-04-19T11:00:00.000Z',
      },
    ];
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: rows, error: null })
    );

    const list = await getCommentsForPost('post-id-001');

    expect(list).toHaveLength(2);
    expect(list[0].commentId).toBe('c1');
    expect(list[0].content).toBe('First');
    expect(list[1].commentId).toBe('c2');
  });

  it('GC2 | empty postId → throws INVALID_POST_ID', async () => {
    await expect(getCommentsForPost('')).rejects.toThrow('INVALID_POST_ID');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('GC3 | no comments → resolves with []', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: [], error: null })
    );

    const list = await getCommentsForPost('post-id-001');
    expect(list).toEqual([]);
  });
});

// =============================================================================
// getFeedByCategory()
// =============================================================================

describe('getFeedByCategory()', () => {
  const MOCK_POSTS = [
    {
      id: 'post-id-001', user_id: 'uuid-a', content: 'Hello!',
      media_url: null, section: 'general', created_at: '2026-04-19T10:00:00.000Z',
    },
    {
      id: 'post-id-002', user_id: 'uuid-b', content: 'World!',
      media_url: null, section: 'general', created_at: '2026-04-18T09:00:00.000Z',
    },
  ];

  it('GF1 | valid category "general" → resolves with Post array', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: MOCK_POSTS, error: null })
    );

    const posts = await getFeedByCategory('general');

    expect(Array.isArray(posts)).toBe(true);
    expect(posts).toHaveLength(2);
    expect(posts[0].postId).toBe('post-id-001');
    expect(posts[0].type).toBe('general');
  });

  it('GF2 | invalid category "sports" → throws INVALID_CATEGORY (no Supabase call)', async () => {
    await expect(getFeedByCategory('sports')).rejects.toThrow('INVALID_CATEGORY');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('GF3 | category = "event" → throws INVALID_CATEGORY (events not in posts)', async () => {
    await expect(getFeedByCategory('event')).rejects.toThrow('INVALID_CATEGORY');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('GF4 | category = "events" → throws (use eventService, not posts)', async () => {
    await expect(getFeedByCategory('events')).rejects.toThrow('eventService');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// searchFeed()
// =============================================================================

describe('searchFeed()', () => {
  it('SF1 | valid query → resolves with matching Post array', async () => {
    const mockResults = [
      {
        id: 'post-id-003', user_id: 'uuid-c', content: 'Study group forming for CS 3354!',
        media_url: null, section: 'general', created_at: '2026-04-19T12:00:00.000Z',
      },
    ];
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: mockResults, error: null })
    );

    const posts = await searchFeed('CS 3354');

    expect(posts).toHaveLength(1);
    expect(posts[0].content).toContain('CS 3354');
  });

  it('SF2 | empty query → throws INVALID_QUERY (no Supabase call)', async () => {
    await expect(searchFeed('')).rejects.toThrow('INVALID_QUERY');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('SF3 | valid query, no matches → resolves with empty array', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeMock({ data: [], error: null })
    );

    const posts = await searchFeed('xyzzy-no-results');

    expect(Array.isArray(posts)).toBe(true);
    expect(posts).toHaveLength(0);
  });

  it('SF4 | category = "event" → throws INVALID_CATEGORY', async () => {
    await expect(searchFeed('hello', 'event')).rejects.toThrow('INVALID_CATEGORY');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('SF5 | category = "events" → throws (use eventService)', async () => {
    await expect(searchFeed('hello', 'events')).rejects.toThrow('eventService');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
