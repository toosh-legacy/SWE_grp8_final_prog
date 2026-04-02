/**
 * StudyGroup.ts — Campus Connect: Study Groups
 * 
 * Domain model representing a study group entity.
 * Contains all attributes required for group creation and management.
 */

export class StudyGroup {
  constructor(
    public name: string,
    public description: string,
    public courses: string,
    public visibility: boolean,
    public creator: string
  ) {}
}
