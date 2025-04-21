import { Controller, Body, Put, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';

// Define the request with user interface
interface RequestWithUser {
  user: {
    sub: number;
    username: string;
  };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    // Get user ID from JWT token (attached by the JwtAuthGuard)
    const userId = req.user.sub;

    const user = await this.userService.findOne(userId);

    // Exclude password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async update(@Request() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    // Get user ID from JWT token (attached by the JwtAuthGuard)
    const userId = req.user.sub;

    const user = await this.userService.update(userId, updateUserDto);

    // Exclude password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
