export enum Program {
  PGD = 'PGD',
  MSC = 'MSc',
  MPHIL = 'MPhil',
  PHD = 'PhD'
}

export enum StudentStatus {
  ACTIVE = 'Active',
  ALUMNI = 'Alumni'
}

export enum PresentationStatus {
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  PENDING = 'Pending'
}

export enum UserRole {
  ADMIN = 'Admin',
  COORDINATOR = 'Coordinator'
}

export interface Student {
  id: string;
  name: string;
  regNumber: string;
  program: Program;
  email: string;
  supervisor: string;
  coSupervisor?: string;
  joinedDate: string;
  status: StudentStatus;
  createdBy: string;
  presentations?: string[];
  currentStage?: string;
  department?: string;
}

export interface Presentation {
  id: string;
  studentId: string;
  title: string;
  stage: string;
  status: PresentationStatus;
  date?: string;
  time?: string;
  venue?: string;
  documentLink?: string;
  score?: string;
  remarks?: string;
  updatedBy: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: string;
}

export const PROGRAM_STAGES: Record<Program, string[]> = {
  'PGD': ['Project Defense'],
  'MSc': ['Proposal Defense', 'Pre-Data Presentation', 'Final Defense'],
  'MPhil': ['Proposal Defense', 'Pre-Data Presentation', 'Final Defense'],
  'PhD': ['Proposal Defense', 'Pre-Data Presentation', 'Post-Data Presentation', 'Viva Voce']
};
