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
