export class AttendanceFromCoreDto {
    studentId: string;
    courseId: string;
    date: string;
    status: 'P' | 'A' | 'M';
  }
  