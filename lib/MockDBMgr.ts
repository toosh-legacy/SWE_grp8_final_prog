/**
 * MockDBMgr.ts — Campus Connect: Study Groups
 * 
 * In-memory mock database for local development and testing.
 * Implements the same interface as DBMgr but stores data in memory.
 * Replace with real DBMgr when ready to connect to Supabase.
 * 
 * Uses a singleton pattern to persist data across API requests.
 */

import { StudyGroup } from './StudyGroup'

// Singleton instance - persists data across API requests
let instance: MockDBMgr | null = null

export class MockDBMgr {
  private groups: StudyGroup[] = []

  constructor() {
    // Return singleton instance if already created
    if (instance) {
      return instance
    }
    instance = this
  }

  async saveStudyGroup(g: StudyGroup): Promise<void> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10))
    this.groups.push(g)
  }

  async getStudyGroups(): Promise<StudyGroup[]> {
    await new Promise(resolve => setTimeout(resolve, 10))
    return [...this.groups]
  }

  async getStudyGroupById(index: number): Promise<StudyGroup | null> {
    await new Promise(resolve => setTimeout(resolve, 10))
    return this.groups[index] || null
  }

  // Helper to clear data (useful for testing)
  async clear(): Promise<void> {
    this.groups = []
  }
}
