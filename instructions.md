# Agent Instructions: Study Group Creation – Test Implementation

## Context & Architecture

Based on the sequence diagram, the flow is:
**User → CreateGroupUI → GroupController → DBMgr → StudyGroup (object) + Msg (object)**

---

## Part 1: Classes to Create

### Project Setup (Next.js + Supabase + Jest)

The agent should initialize a Next.js project with the following structure:

```
/lib
  StudyGroup.ts
  Msg.ts
  GroupController.ts
  DBMgr.ts
/app/api/groups/route.ts   ← API route acting as GroupController endpoint
/__tests__
  GroupController.test.ts
```

**Dependencies to install:**
```bash
npm install @supabase/supabase-js
npm install --save-dev jest @types/jest ts-jest
```

**`jest.config.js`** should use `ts-jest` with `testEnvironment: 'node'`.

---

### Class Definitions

**`/lib/StudyGroup.ts`**
```ts
export class StudyGroup {
  constructor(
    public name: string,
    public description: string,
    public courses: string,
    public visibility: boolean,
    public creator: string
  ) {}
}
```

**`/lib/Msg.ts`**
```ts
export class Msg {
  constructor(public message: string) {}
}
```

**`/lib/DBMgr.ts`**
```ts
import { createClient } from '@supabase/supabase-js'
import { StudyGroup } from './StudyGroup'

export class DBMgr {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async saveStudyGroup(g: StudyGroup): Promise<void> {
    const { error } = await this.supabase.from('study_groups').insert([g])
    if (error) throw new Error(error.message)
  }
}
```

**`/lib/GroupController.ts`**
```ts
import { StudyGroup } from './StudyGroup'
import { DBMgr } from './DBMgr'
import { Msg } from './Msg'

export class GroupController {
  private db: DBMgr

  constructor(db: DBMgr) {
    this.db = db
  }

  async createGroup(
    name: string,
    description: string,
    courses: string,
    visibility: boolean,
    creator: string
  ): Promise<Msg> {
    if (!name || name.trim() === '') throw new Error('Name is required')
    if (name.length > 255) throw new Error('Name too long')
    if (!creator || creator.trim() === '') throw new Error('Creator is required')

    const g = new StudyGroup(name, description, courses, visibility, creator)
    await this.db.saveStudyGroup(g)
    return new Msg('Study Group Created')
  }
}
```

---

## Part 2A: Input Analysis

| Parameter | Type | Valid | Invalid | Exceptional |
|---|---|---|---|---|
| `name` | string | `"Math101"` | `""`, `" "` | `null`, 256+ chars |
| `description` | string | `"A study group"` | — | `null`, very long string |
| `courses` | string | `"CS101,CS102"` | — | `null`, empty |
| `visibility` | boolean | `true`, `false` | non-boolean | `null`, `undefined` |
| `creator` | string | `"user-uuid-123"` | `""` | `null`, non-existent user |

---

## Part 2B: Test Case Scenarios

Before narrowing down, possible scenarios:
1. All valid inputs → success
2. Empty name → error
3. Whitespace-only name → error
4. Null name → error
5. Name > 255 chars → error
6. Empty creator → error
7. Null creator → error
8. DB throws error → propagated error
9. `visibility = false` (private group) → success
10. Empty description (optional field) → success
11. Empty courses → success or error depending on business rule

**Narrowed to 7 representative cases** covering valid, invalid, boundary, and exceptional paths.

---

## Part 2C: Concrete Values

| # | name | description | courses | visibility | creator | Expected Output |
|---|---|---|---|---|---|---|
| TC1 | `"Math Study"` | `"Algebra help"` | `"MATH101"` | `true` | `"user-1"` | `Msg("Study Group Created")` |
| TC2 | `""` | `"desc"` | `"CS101"` | `true` | `"user-1"` | throws `"Name is required"` |
| TC3 | `"   "` | `"desc"` | `"CS101"` | `true` | `"user-1"` | throws `"Name is required"` |
| TC4 | `"A".repeat(256)` | `"desc"` | `"CS101"` | `true` | `"user-1"` | throws `"Name too long"` |
| TC5 | `"Night Owls"` | `""` | `""` | `false` | `"user-2"` | `Msg("Study Group Created")` |
| TC6 | `"Bio Group"` | `"Bio help"` | `"BIO101"` | `true` | `""` | throws `"Creator is required"` |
| TC7 | `"CS Group"` | `"desc"` | `"CS101"` | `true` | `"user-1"` | throws `"DB error"` (DB mock fails) |

---

## Part 2D: Test Implementation

**`/__tests__/GroupController.test.ts`**

```ts
import { GroupController } from '../lib/GroupController'
import { DBMgr } from '../lib/DBMgr'
import { Msg } from '../lib/Msg'

// Mock DBMgr
const mockSave = jest.fn()
const mockDB = { saveStudyGroup: mockSave } as unknown as DBMgr

describe('GroupController - createGroup', () => {
  let controller: GroupController

  beforeEach(() => {
    jest.clearAllMocks()
    mockSave.mockResolvedValue(undefined) // default: DB succeeds
    controller = new GroupController(mockDB)
  })

  // TC1 - Valid inputs
  test('TC1: valid inputs returns Study Group Created message', async () => {
    const result = await controller.createGroup(
      'Math Study', 'Algebra help', 'MATH101', true, 'user-1'
    )
    expect(result).toBeInstanceOf(Msg)
    expect(result.message).toBe('Study Group Created')
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  // TC2 - Empty name
  test('TC2: empty name throws error', async () => {
    await expect(
      controller.createGroup('', 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('Name is required')
    expect(mockSave).not.toHaveBeenCalled()
  })

  // TC3 - Whitespace name
  test('TC3: whitespace-only name throws error', async () => {
    await expect(
      controller.createGroup('   ', 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('Name is required')
  })

  // TC4 - Name too long (add this validation to GroupController)
  test('TC4: name exceeding 255 chars throws error', async () => {
    const longName = 'A'.repeat(256)
    await expect(
      controller.createGroup(longName, 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('Name too long')
  })

  // TC5 - Private group, empty optional fields
  test('TC5: private group with empty description and courses succeeds', async () => {
    const result = await controller.createGroup(
      'Night Owls', '', '', false, 'user-2'
    )
    expect(result.message).toBe('Study Group Created')
  })

  // TC6 - Empty creator
  test('TC6: empty creator throws error', async () => {
    await expect(
      controller.createGroup('Bio Group', 'Bio help', 'BIO101', true, '')
    ).rejects.toThrow('Creator is required')
  })

  // TC7 - DB failure propagates
  test('TC7: DB failure propagates error', async () => {
    mockSave.mockRejectedValue(new Error('DB error'))
    await expect(
      controller.createGroup('CS Group', 'desc', 'CS101', true, 'user-1')
    ).rejects.toThrow('DB error')
  })
})
```

---

## Supabase Setup Instructions for Agent

1. Create a `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

2. Create a `study_groups` table in Supabase with columns:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `name` (text, not null)
   - `description` (text)
   - `courses` (text)
   - `visibility` (boolean)
   - `creator` (text)
   - `created_at` (timestamptz, default `now()`)

3. The unit tests **mock DBMgr** so they don't need a live Supabase connection. Integration/E2E tests against the real DB should be in a separate `/__tests__/integration/` folder and only run with real env vars present.
