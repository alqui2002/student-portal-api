import { Controller, Get, Post, Param, Body, Query, UseGuards, BadRequestException, Req, Patch, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @Get()
  @UseGuards(ExternalJwtAuthGuard)
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: string
  ) {
    if (status === 'available') {
      if (!userId) {
        throw new BadRequestException('userId is required to get available courses');
      }
      return this.coursesService.findAvailableCoursesForUser(userId);
    }

    if (userId) {
      return this.coursesService.findCoursesForUser(userId);
    }

    return this.coursesService.findAll();
  }

  @Get('sync')
  @UseGuards(ExternalJwtAuthGuard)
  async syncCousesFromCore(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.coursesService.syncCousesFromCore(token);
  }

  @Get(':id')
  @UseGuards(ExternalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(ExternalJwtAuthGuard)
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(':id/correlatives')
  addCorrelative(
    @Param('id') courseId: string,
    @Body('correlativeId') correlativeId: string,
  ) {
    if (!correlativeId) {
      throw new BadRequestException('correlativeId is required');
    }

    return this.coursesService.addCorrelative(courseId, correlativeId);
  }

  @Delete(':id/correlatives')
  removeCorrelative(
    @Param('id') courseId: string,
    @Body('correlativeId') correlativeId: string,
  ) {
    if (!correlativeId) {
      throw new BadRequestException('correlativeId is required');
    }

    return this.coursesService.removeCorrelative(courseId, correlativeId);
  }

  @Delete(':id')
  removeCourse(@Param('id') courseId: string) {
    return this.coursesService.removeCourse(courseId);
  }

  @Post('core-event')
  async upsertFromCore(@Body() body: {
    uuid: string;
    name: string;
    description?: string;
    careerId: string;
    code: string;
  }) {
    return this.coursesService.upsertFromCore(body);
  }
}
