import { D1Database } from '@cloudflare/workers-types';
import { AcademicYearService, AcademicTermService } from './academicYearsService';
import { StudentProfileService, CourseEnrollmentService } from './studentsService';
import { ClassSessionService } from './classSessionsService';
import { AttendanceService } from './attendanceService';
import { ObservationService } from './observationsService';
import { PlanningReviewService } from './planningReviewsService';
import { ClassbookAuditService } from './auditService';
import { SignaturesService } from './signaturesService';

export interface ClassbookServicesEnv {
  DB: D1Database;
}

export interface ClassbookServices {
  academicYears: AcademicYearService;
  academicTerms: AcademicTermService;
  students: StudentProfileService;
  enrollments: CourseEnrollmentService;
  classSessions: ClassSessionService;
  attendance: AttendanceService;
  observations: ObservationService;
  planningReviews: PlanningReviewService;
  audit: ClassbookAuditService;
  signatures: SignaturesService;
}

export function createClassbookServices(env: ClassbookServicesEnv): ClassbookServices {
  return {
    academicYears: new AcademicYearService(env),
    academicTerms: new AcademicTermService(env),
    students: new StudentProfileService(env),
    enrollments: new CourseEnrollmentService(env),
    classSessions: new ClassSessionService(env),
    attendance: new AttendanceService(env),
    observations: new ObservationService(env),
    planningReviews: new PlanningReviewService(env),
    audit: new ClassbookAuditService(env),
    signatures: new SignaturesService(env),
  };
}

export * from './academicYearsService';
export * from './studentsService';
export * from './classSessionsService';
export * from './attendanceService';
export * from './observationsService';
export * from './planningReviewsService';
export * from './auditService';
export * from './signaturesService';