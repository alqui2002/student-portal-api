import { Controller, Get, Post, Param, Body, Query, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @UseGuards(ExternalJwtAuthGuard)
  @Get()
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
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
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
