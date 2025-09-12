import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginResponse } from '@kronos/shared-types';
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
    // User is already authenticated via JWT guard
    const user = await this.usersService.findByEmail(req.user.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate new JWT token
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.authService.generateToken(payload);
    const userResponse = await this.usersService.findOne(user.id);

    return {
      accessToken,
      user: userResponse as any,
      tokenType: 'Bearer',
      expiresIn: 1800, // 30 minutes
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // We could implement token blacklisting here if needed
    return { message: 'Logged out successfully' };
  }
}
