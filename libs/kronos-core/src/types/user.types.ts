export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  profileImageUrl?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  profileImageUrl?: string;
}

export type UserResponseDto = User;
