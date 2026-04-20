// login.ts — Campus Connect
// Auth subsystem types. Student interface matches the DCD.

export interface Student {
  studentId: string;
  name: string;
  email: string;
  campus: string;
  major: string;
  bio: string;
  avatarUrl: string;
  passwordHash: string;
}
