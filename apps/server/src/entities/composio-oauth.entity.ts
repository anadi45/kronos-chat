import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { User } from './user.entity';

@Entity('composio_oauth')
export class ComposioOAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  @IsUUID()
  userId: string;

  @Column({ name: 'platform', type: 'varchar', length: 100, nullable: false })
  @IsString()
  platform: string;

  @Column({ name: 'auth_config_id', type: 'varchar', length: 1000, nullable: false })
  @IsString()
  authConfigId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationship with User entity
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Serialize to plain object
  toDict() {
    return {
      id: this.id,
      userId: this.userId,
      platform: this.platform,
      authConfigId: this.authConfigId,
      createdAt: this.createdAt?.toISOString() || null,
      updatedAt: this.updatedAt?.toISOString() || null,
    };
  }
}
