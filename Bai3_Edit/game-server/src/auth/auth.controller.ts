import { Controller, Post, UseGuards, Request, Get, Render, Res, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req, @Res() res: Response) {
    const auth = await this.authService.login(req.user);
    // Store token in cookie - make sure it's the exact name expected by our JWT strategy
    res.cookie('access_token', auth.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only for HTTPS in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    
    // Store user info in session if needed
    req.session.user = auth.user;
    
    // Redirect to home page
    return res.redirect('/');
  }

  @Get('login')
  @Render('auth/login')
  loginPage(@Req() req) {
    return { 
      title: 'Login',
      stylesheets: '',
      scripts: '',
      user: null,
      success: req.query.success || null,
      error: req.query.error || null
    };
  }

  @Get('register')
  @Render('auth/register')
  registerPage(@Req() req) {
    return { 
      title: 'Register',
      stylesheets: '',
      scripts: '',
      user: null,
      success: null,
      error: req.query.error || null
    };
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Req() req, @Res() res: Response) {
    try {
      // Create the user
      const user = await this.usersService.create(createUserDto);
      
      // Redirect to login page with success message
      return res.redirect('/auth/login?success=' + encodeURIComponent('Registration successful. Please login with your credentials.'));
    } catch (error) {
      // If there's an error (e.g., duplicate username), redirect back to register page
      return res.redirect('/auth/register?error=' + encodeURIComponent(error.message));
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
  
  @Post('logout')
  logout(@Req() req, @Res() res: Response) {
    // Clear cookie and session
    res.clearCookie('access_token');
    req.session.user = null;
    
    // Redirect to login page
    return res.redirect('/auth/login');
  }
} 