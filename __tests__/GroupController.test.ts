/**
 * GroupController.test.ts — Campus Connect: Study Groups
 * Test Suite for the Study Group Creation Subsystem
 *
 * Testing Framework : Jest
 * Module Under Test : src/lib/GroupController.ts
 *
 * Covers all DCD methods:
 *   createGroup(name, description, courses, visibility, creator) → Msg object
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 1 — INPUT VALUE ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Method: createGroup(name: String, description: String, courses: String,
 *                      visibility: Boolean, creator: String)
 * ┌──────────────┬─────────┬──────────────────────────┬──────────────────────┬─────────────────────────┐
 * │ Variable     │ Type    │ Valid                    │ Invalid              │ Exceptional             │
 * ├──────────────┼─────────┼──────────────────────────┼──────────────────────┼─────────────────────────┤
 * │ name         │ String  │ "Math Study"             │ ""                   │ null, > 255 chars       │
 * │ description  │ String  │ "Algebra help"           │ —                    │ null, very long string  │
 * │ courses      │ String  │ "MATH101"                │ —                    │ null, empty             │
 * │ visibility   │ Boolean │ true, false              │ non-boolean          │ null, undefined         │
 * │ creator      │ String  │ "user-1" (valid id)      │ ""                   │ null, non-existent user │
 * └──────────────┴─────────┴──────────────────────────┴──────────────────────┴─────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 2 — TEST CASE SCENARIOS  (fig 20.14, pg 521)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  createGroup() — 7 scenarios identified, covering valid, invalid, boundary, and exceptional paths
 * ┌──────┬──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────────┐
 * │ TC # │ name                 │ creator              │ visibility           │ Expected Output          │
 * ├──────┼──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────────┤
 * │ C1   │ valid name           │ valid id             │ true                 │ Msg("Study Group Created"│
 * │ C2   │ empty string ""      │ valid id             │ true                 │ throws "Name is required"│
 * │ C3   │ whitespace only      │ valid id             │ true                 │ throws "Name is required"│
 * │ C4   │ > 255 characters     │ valid id             │ true                 │ throws "Name too long"   │
 * │ C5   │ valid name           │ empty string ""      │ true                 │ throws "Creator required"│
 * │ C6   │ valid (private)      │ valid id             │ false                │ Msg("Study Group Created"│
 * │ C7   │ valid name           │ valid id (DB error)  │ true                 │ throws "DB error"        │
 * └──────┴──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 3 — CONCRETE TEST CASE VALUES  (fig 20.15, pg 522)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  createGroup() concrete values
 * ┌──────┬────────────────────────────┬──────────────────────┬──────────────────────┬────────────────────────────────────┐
 * │ TC # │ name (concrete)            │ creator (concrete)   │ visibility (concrete)│ Expected Output (concrete)         │
 * ├──────┼────────────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────────┤
 * │ C1   │ "Math Study"               │ "user-1"             │ true                 │ Msg("Study Group Created")         │
 * │ C2   │ ""                         │ "user-1"             │ true                 │ Error: "Name is required"          │
 * │ C3   │ "   " (3 spaces)           │ "user-1"             │ true                 │ Error: "Name is required"          │
 * │ C4   │ "A" × 256                  │ "user-1"             │ true                 │ Error: "Name too long"             │
 * │ C5   │ "Bio Group"                │ "" (empty)           │ true                 │ Error: "Creator is required"       │
 * │ C6   │ "Night Owls"               │ "user-2"             │ false (private)      │ Msg("Study Group Created")         │
 * │ C7   │ "CS Group"                 │ "user-1" (DB fails)  │ true                 │ Error: "DB error"                  │
 * └──────┴────────────────────────────┴──────────────────────┴──────────────────────┴────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GroupController } from '../lib/GroupController'
import { DBMgr } from '../lib/DBMgr'
import { Msg } from '../lib/Msg'
import { beforeEach, describe, expect, test, vi } from 'vitest'

// Mock DBMgr
const mockSave = vi.fn()
const mockDB = { saveStudyGroup: mockSave } as unknown as DBMgr

describe('GroupController - createGroup', () => {
  let controller: GroupController

  beforeEach(() => {
    vi.clearAllMocks()
    mockSave.mockResolvedValue(undefined) // default: DB succeeds
    controller = new GroupController(mockDB)
  })

  // TC1 - Valid inputs → Msg object returned
  test('TC1: valid inputs returns Study Group Created message', async () => {
    const result = await controller.createGroup(
      'Math Study', 'Algebra help', 'MATH101', true, 'user-1'
    )
    expect(result).toBeInstanceOf(Msg)
    expect(result.message).toBe('Study Group Created')
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  // TC2 - Empty name → throws error
  test('TC2: empty name throws error', async () => {
    await expect(
      controller.createGroup('', 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('Name is required')
    expect(mockSave).not.toHaveBeenCalled()
  })

  // TC3 - Whitespace-only name → throws error
  test('TC3: whitespace-only name throws error', async () => {
    await expect(
      controller.createGroup('   ', 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('Name is required')
  })

  // TC4 - Name exceeds 255 chars → throws error
  test('TC4: name exceeding 255 chars throws error', async () => {
    const longName = 'A'.repeat(256)
    await expect(
      controller.createGroup(longName, 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('Name too long')
  })

  // TC5 - Empty creator → throws error
  test('TC5: empty creator throws error', async () => {
    await expect(
      controller.createGroup('Bio Group', 'Bio help', 'BIO101', true, '')
    ).rejects.toThrow('Creator is required')
  })

  // TC6 - Private group (visibility = false) with optional fields → succeeds
  test('TC6: private group with empty description and courses succeeds', async () => {
    const result = await controller.createGroup(
      'Night Owls', '', '', false, 'user-2'
    )
    expect(result.message).toBe('Study Group Created')
  })

  // TC7 - DB failure → error propagates
  test('TC7: DB failure propagates error', async () => {
    mockSave.mockRejectedValue(new Error('DB error'))
    await expect(
      controller.createGroup('CS Group', 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('DB error')
  })
})
