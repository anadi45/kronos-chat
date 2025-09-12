import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, UserResponseDto } from '../dto/user.dto';
import type { JwtPayload, LoginResponse } from '@kronos/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const userResponse = await this.usersService.findOne(user.id);

    return {
      accessToken,
      user: userResponse as any,
      tokenType: 'Bearer',
      expiresIn: 1800, // 30 minutes
    };
  }

  async validateUser(payload: JwtPayload): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return user;
  }

  generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
