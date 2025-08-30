import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsString()
  password_hash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  @IsBoolean()
  is_active: boolean;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  profile_image_url?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Property to get full name from first and last name
  get full_name(): string | null {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    }
    return null;
  }

  // Convert user entity to dictionary for JSON serialization
  toDict() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      is_active: this.is_active,
      profile_image_url: this.profile_image_url,
      last_login: this.last_login?.toISOString() || null,
      created_at: this.created_at?.toISOString() || null,
      updated_at: this.updated_at?.toISOString() || null,
      full_name: this.full_name,
    };
  }
}
