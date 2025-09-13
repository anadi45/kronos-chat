import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsBoolean, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { User } from './user.entity';

/**
 * Status enum for Composio integrations
 */
export enum ComposioIntegrationStatus {
  INITIATED = 'INITIATED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Composio Integration Entity
 * Represents a user's connection to a third-party service via Composio
 */
@Entity('composio_integrations')
@Index(['user_id', 'provider'], { unique: true })
@Index(['composio_connection_id'], { unique: true })
export class ComposioIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  @IsUUID()
  userId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  @IsString()
  provider: string;

  @Column({ name: 'composio_auth_config_id', type: 'varchar', length: 255, nullable: false })
  @IsString()
  composioAuthConfigId: string;

  @Column({ name: 'composio_connection_id', type: 'varchar', length: 255, nullable: false })
  @IsString()
  composioConnectionId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ComposioIntegrationStatus.INITIATED,
    nullable: false,
  })
  @IsEnum(ComposioIntegrationStatus)
  status: ComposioIntegrationStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  @IsBoolean()
  isActive: boolean;

  @Column({ name: 'connected_at', type: 'timestamptz', nullable: true })
  @IsOptional()
  connectedAt?: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  @IsOptional()
  lastUsedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  @IsOptional()
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Helper methods
  /**
   * Check if the integration is currently active and not expired
   */
  get isCurrentlyActive(): boolean {
    if (!this.isActive || this.status !== ComposioIntegrationStatus.ACTIVE) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if the integration has expired
   */
  get isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }

  /**
   * Get the display name for the provider
   */
  get providerDisplayName(): string {
    const displayNames: Record<string, string> = {
      GMAIL: 'Gmail',
      SLACK: 'Slack',
      NOTION: 'Notion',
      GOOGLE_CALENDAR: 'Google Calendar',
      GOOGLE_DRIVE: 'Google Drive',
      GITHUB: 'GitHub',
      TRELLO: 'Trello',
    };

    return displayNames[this.provider] || this.provider;
  }

  /**
   * Serialize to plain object
   */
  toDict() {
    return {
      id: this.id,
      userId: this.userId,
      provider: this.provider,
      providerDisplayName: this.providerDisplayName,
      composioAuthConfigId: this.composioAuthConfigId,
      composioConnectionId: this.composioConnectionId,
      status: this.status,
      isActive: this.isActive,
      isCurrentlyActive: this.isCurrentlyActive,
      isExpired: this.isExpired,
      connectedAt: this.connectedAt?.toISOString() || null,
      lastUsedAt: this.lastUsedAt?.toISOString() || null,
      expiresAt: this.expiresAt?.toISOString() || null,
      metadata: this.metadata,
      createdAt: this.createdAt?.toISOString() || null,
      updatedAt: this.updatedAt?.toISOString() || null,
    };
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }

  /**
   * Activate the integration
   */
  activate(): void {
    this.status = ComposioIntegrationStatus.ACTIVE;
    this.isActive = true;
    this.connectedAt = new Date();
  }

  /**
   * Deactivate the integration
   */
  deactivate(): void {
    this.status = ComposioIntegrationStatus.INACTIVE;
    this.isActive = false;
  }

  /**
   * Mark as failed
   */
  markAsFailed(): void {
    this.status = ComposioIntegrationStatus.FAILED;
    this.isActive = false;
  }

  /**
   * Mark as expired
   */
  markAsExpired(): void {
    this.status = ComposioIntegrationStatus.EXPIRED;
    this.isActive = false;
  }
}
