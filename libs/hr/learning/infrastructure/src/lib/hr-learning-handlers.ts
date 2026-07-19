import { CancelCourseEnrollmentHandler } from './handlers/cancel-course-enrollment.handler';
import { CompleteCourseEnrollmentHandler } from './handlers/complete-course-enrollment.handler';
import { CreateCourseHandler } from './handlers/create-course.handler';
import { DeactivateCourseHandler } from './handlers/deactivate-course.handler';
import { EnrollInCourseHandler } from './handlers/enroll-in-course.handler';
import { ListCourseEnrollmentsForEmployeeHandler } from './handlers/list-course-enrollments-for-employee.handler';
import { ListCoursesHandler } from './handlers/list-courses.handler';

export const HR_LEARNING_COMMAND_HANDLERS = [
  CreateCourseHandler,
  DeactivateCourseHandler,
  EnrollInCourseHandler,
  CompleteCourseEnrollmentHandler,
  CancelCourseEnrollmentHandler,
];

export const HR_LEARNING_QUERY_HANDLERS = [ListCoursesHandler, ListCourseEnrollmentsForEmployeeHandler];
