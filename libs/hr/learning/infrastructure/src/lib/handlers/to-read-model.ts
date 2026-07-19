import { CourseEnrollmentReadModel, CourseReadModel } from '@abms/hr-learning-application';
import { Course, CourseEnrollment } from '@abms/hr-learning-domain';

export function toCourseReadModel(course: Course): CourseReadModel {
  return {
    id: course.id.toValue(),
    title: course.title,
    description: course.description,
    durationHours: course.durationHours,
    category: course.category,
    isActive: course.isActive,
  };
}

export function toCourseEnrollmentReadModel(enrollment: CourseEnrollment): CourseEnrollmentReadModel {
  return {
    id: enrollment.id.toValue(),
    employeeId: enrollment.employeeId.toValue(),
    courseId: enrollment.courseId.toValue(),
    enrolledDate: enrollment.enrolledDate.toISOString().slice(0, 10),
    status: enrollment.status,
    score: enrollment.score,
    completedDate: enrollment.completedDate?.toISOString().slice(0, 10) ?? null,
  };
}
