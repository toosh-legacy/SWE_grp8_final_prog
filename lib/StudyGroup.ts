export class StudyGroup {
  constructor(
    public name: string,
    public description: string,
    public courses: string,
    public visibility: boolean,
    public creator: string
  ) {}
}
