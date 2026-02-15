export interface Member {
  id: string;
  name: string;
  joinDate: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface AttendanceRecord {
  memberId: string;
  status: AttendanceStatus;
}

export interface MeetingSession {
  id: string;
  date: string;
  topic?: string;
  records: AttendanceRecord[];
}

export interface AppSettings {
  leaderName: string;
  coordinatorName: string;
  secretaryName: string;
  troopName: string;
  logoUrl: string | null;
}

export interface AttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  percentage: number;
}