/**
 * GroupController.ts — Campus Connect: Study Groups
 * 
 * Business logic controller for study group operations.
 * Handles validation and orchestration of study group creation.
 */

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
