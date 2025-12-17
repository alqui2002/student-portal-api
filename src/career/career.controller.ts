import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CareerService } from './career.service';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';
import { User } from 'src/auth/user.decorator';

@Controller('careers')
export class CareerController {
  constructor(private readonly careerService: CareerService) { }

  @Get('sync')
  @UseGuards(ExternalJwtAuthGuard)
  async syncCareerFromCore(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.careerService.syncCareersFromCore(token);
  }

  @Get()
  @UseGuards(ExternalJwtAuthGuard)
  findAll() {
    return this.careerService.findAll();
  }

  @Get(':id')
  @UseGuards(ExternalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.careerService.findOne(id);
  }

  @Post()
  @UseGuards(ExternalJwtAuthGuard)  
  create(@Body() body: { name: string; description?: string }) {
    return this.careerService.create(body);
  }

  @Post(':id/courses')
  @UseGuards(ExternalJwtAuthGuard)
  addCourse(@Param('id') careerId: string, @Body('courseId') courseId: string) {
    return this.careerService.addCourse(careerId, courseId);
  }

  @Post('core-event')
  upsertFromCore(@Body() body: { id: string; name: string; description?: string }) {
    return this.careerService.upsertFromCore(body);
  }
}
