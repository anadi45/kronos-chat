import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  @IsEmail()
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: false })
  @IsString()
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: false })
  @IsString()
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: false })
  @IsString()
  lastName: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  @IsBoolean()
  isActive: boolean;

  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: false })
  lastLogin: Date;

  @Column({ name: 'composio_auth_config_id', type: 'varchar', length: 1000, nullable: true })
  @IsOptional()
  @IsString()
  composioAuthConfigId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Computed full name
  get fullName(): string {
    const firstName = this.firstName;
    const lastName = this.lastName;
    return `${firstName} ${lastName}`.trim();
  }

  // Serialize to plain object
  toDict() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      profileImageUrl: this.profileImageUrl,
      lastLogin: this.lastLogin?.toISOString() || null,
      createdAt: this.createdAt?.toISOString() || null,
      updatedAt: this.updatedAt?.toISOString() || null,
      fullName: this.fullName,
    };
  }
}
