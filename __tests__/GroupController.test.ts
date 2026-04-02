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
