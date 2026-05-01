/**
 * DBMgr.ts — Study Group Service
 * 
 * Database management layer for study group operations.
 * Handles all Supabase interactions.
 */

import { supabase } from './SupabaseClient'
import { StudyGroup } from './StudyGroup'

export class DBMgr {
  async saveStudyGroup(g: StudyGroup): Promise<void> {
    const { error } = await supabase.from('study_groups').insert([g])
    if (error) throw new Error(error.message)
  }
}
