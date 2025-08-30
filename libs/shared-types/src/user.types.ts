export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  profile_image_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export interface UpdateUserDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  profile_image_url?: string;
}

export interface UserResponseDto extends User {}
