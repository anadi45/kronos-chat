import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, CreateUserDto, UserResponseDto } from '../dto/user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() createUserDto: CreateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<UserResponseDto> {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req): Promise<LoginResponse> {
    // Create a new token for the authenticated user
    const loginDto: LoginDto = {
      email: req.user.email,
      password: '', // We don't need the password for refresh since user is already authenticated
    };

    // For refresh, we bypass password validation by directly creating a new token
    const user = await this.usersService.findByEmail(req.user.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // This would normally require a separate refresh token implementation
    // For now, we'll return the same response as login
    return this.authService.login({ email: user.email, password: 'refresh' });
  }
}
