import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  CancelCourseEnrollmentCommand,
  CompleteCourseEnrollmentCommand,
  CourseEnrollmentReadModel,
  CourseReadModel,
  CreateCourseCommand,
  CreateCourseResult,
  DeactivateCourseCommand,
  EnrollInCourseCommand,
  EnrollInCourseResult,
  ListCourseEnrollmentsForEmployeeQuery,
  ListCoursesQuery,
} from '@abms/hr-learning-application';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompleteCourseEnrollmentDto } from './dto/complete-course-enrollment.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollInCourseDto } from './dto/enroll-in-course.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/learning')
@UseGuards(AuthGuard('jwt'))
export class LearningController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('courses')
  public createCourse(@Body() dto: CreateCourseDto): Promise<CreateCourseResult> {
    return this.commandBus.execute(
      new CreateCourseCommand(dto.title, dto.durationHours, dto.category, dto.description ?? null),
    );
  }

  @Get('courses')
  public listCourses(): Promise<CourseReadModel[]> {
    return this.queryBus.execute(new ListCoursesQuery());
  }

  @Patch('courses/:id/deactivate')
  public deactivateCourse(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeactivateCourseCommand(id));
  }

  @Post('courses/:courseId/employees/:employeeId/enrollments')
  public enrollInCourse(
    @Param('courseId') courseId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: EnrollInCourseDto,
  ): Promise<EnrollInCourseResult> {
    return this.commandBus.execute(new EnrollInCourseCommand(employeeId, courseId, dto.enrolledDate));
  }

  @Get('employees/:employeeId/enrollments')
  public listCourseEnrollmentsForEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<CourseEnrollmentReadModel[]> {
    return this.queryBus.execute(new ListCourseEnrollmentsForEmployeeQuery(employeeId));
  }

  @Patch('enrollments/:id/complete')
  public completeCourseEnrollment(
    @Param('id') id: string,
    @Body() dto: CompleteCourseEnrollmentDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new CompleteCourseEnrollmentCommand(id, dto.completedDate, dto.score ?? null),
    );
  }

  @Patch('enrollments/:id/cancel')
  public cancelCourseEnrollment(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CancelCourseEnrollmentCommand(id));
  }
}
