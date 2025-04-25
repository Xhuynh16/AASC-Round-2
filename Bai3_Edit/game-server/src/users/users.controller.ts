import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException, Render, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    // Redirect to the auth/register endpoint to handle registration
    return res.redirect(307, '/auth/register'); // 307 preserves the POST method
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Render('users/profile')
  async getProfilePage(@Req() req) {
    const user = await this.usersService.findOne(req.user.id);
    return { 
      title: 'User Profile',
      stylesheets: '',
      scripts: '',
      user,
      success: null,
      error: null
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/api')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    // Admin can access any profile, users can only access their own
    if (req.user.id !== +id) {
      throw new ForbiddenException('You can only access your own profile');
    }
    return this.usersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    // Admin can update any user, users can only update themselves
    if (req.user.id !== +id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(+id, updateUserDto);
  }
} 