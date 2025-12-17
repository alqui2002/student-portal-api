import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(ExternalJwtAuthGuard)
  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get(':id/courses')
  findUserCourses(@Param('id') id: string) {
    return this.userService.findUserWithCourses(String(id));
  }

  @Post('core-event')
  upsertFromCore(@Body() body: {
    uuid: string;
    name?: string;
    email?: string;
    careerId?: string | null;
  }) {
    return this.userService.upsertFromCore(body);
  }
}
