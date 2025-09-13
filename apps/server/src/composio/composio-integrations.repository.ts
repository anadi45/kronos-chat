import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ComposioIntegration, ComposioIntegrationStatus } from '../entities/composio-integration.entity';

/**
 * Repository service for Composio integrations
 * Handles all database operations for user integrations
 */
@Injectable()
export class ComposioIntegrationsRepository {
  constructor(
    @InjectRepository(ComposioIntegration)
    private readonly repository: Repository<ComposioIntegration>,
  ) {}

  /**
   * Create a new integration record
   */
  async create(data: {
    userId: string;
    provider: string;
    composioAuthConfigId: string;
    composioConnectionId: string;
    status?: ComposioIntegrationStatus;
    metadata?: Record<string, any>;
  }): Promise<ComposioIntegration> {
    const integration = this.repository.create({
      userId: data.userId,
      provider: data.provider,
      composioAuthConfigId: data.composioAuthConfigId,
      composioConnectionId: data.composioConnectionId,
      status: data.status || ComposioIntegrationStatus.INITIATED,
      metadata: data.metadata,
    });

    return this.repository.save(integration);
  }

  /**
   * Find integration by ID
   */
  async findById(id: string): Promise<ComposioIntegration | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Find integration by Composio connection ID
   */
  async findByComposioConnectionId(connectionId: string): Promise<ComposioIntegration | null> {
    return this.repository.findOne({ where: { composioConnectionId: connectionId } });
  }

  /**
   * Find integration by user ID and provider
   */
  async findByUserAndProvider(userId: string, provider: string): Promise<ComposioIntegration | null> {
    return this.repository.findOne({ 
      where: { userId, provider } 
    });
  }

  /**
   * Get all integrations for a user
   */
  async findByUserId(userId: string, activeOnly: boolean = true): Promise<ComposioIntegration[]> {
    const where: FindOptionsWhere<ComposioIntegration> = { userId };
    
    if (activeOnly) {
      where.isActive = true;
    }

    return this.repository.find({ 
      where,
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get all integrations for a specific provider
   */
  async findByProvider(provider: string, activeOnly: boolean = true): Promise<ComposioIntegration[]> {
    const where: FindOptionsWhere<ComposioIntegration> = { provider };
    
    if (activeOnly) {
      where.isActive = true;
    }

    return this.repository.find({ 
      where,
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get all integrations with a specific status
   */
  async findByStatus(status: ComposioIntegrationStatus): Promise<ComposioIntegration[]> {
    return this.repository.find({ 
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Update integration status
   */
  async updateStatus(id: string, status: ComposioIntegrationStatus): Promise<ComposioIntegration | null> {
    await this.repository.update(id, { status });
    return this.findById(id);
  }

  /**
   * Activate integration
   */
  async activate(id: string): Promise<ComposioIntegration | null> {
    await this.repository.update(id, {
      status: ComposioIntegrationStatus.ACTIVE,
      isActive: true,
      connectedAt: new Date(),
    });
    return this.findById(id);
  }

  /**
   * Deactivate integration
   */
  async deactivate(id: string): Promise<ComposioIntegration | null> {
    await this.repository.update(id, {
      status: ComposioIntegrationStatus.INACTIVE,
      isActive: false,
    });
    return this.findById(id);
  }

  /**
   * Mark integration as failed
   */
  async markAsFailed(id: string): Promise<ComposioIntegration | null> {
    await this.repository.update(id, {
      status: ComposioIntegrationStatus.FAILED,
      isActive: false,
    });
    return this.findById(id);
  }

  /**
   * Mark integration as expired
   */
  async markAsExpired(id: string): Promise<ComposioIntegration | null> {
    await this.repository.update(id, {
      status: ComposioIntegrationStatus.EXPIRED,
      isActive: false,
    });
    return this.findById(id);
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<ComposioIntegration | null> {
    await this.repository.update(id, {
      lastUsedAt: new Date(),
    });
    return this.findById(id);
  }

  /**
   * Update integration metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<ComposioIntegration | null> {
    await this.repository.update(id, { metadata });
    return this.findById(id);
  }

  /**
   * Soft delete integration (set is_active to false)
   */
  async softDelete(id: string): Promise<ComposioIntegration | null> {
    await this.repository.update(id, {
      isActive: false,
      status: ComposioIntegrationStatus.INACTIVE,
    });
    return this.findById(id);
  }

  /**
   * Hard delete integration
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  /**
   * Delete integration by Composio connection ID
   */
  async deleteByComposioConnectionId(connectionId: string): Promise<boolean> {
    const result = await this.repository.delete({ composioConnectionId: connectionId });
    return result.affected > 0;
  }

  /**
   * Get integration statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    byProvider: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const where: FindOptionsWhere<ComposioIntegration> = {};
    if (userId) {
      where.userId = userId;
    }

    const integrations = await this.repository.find({ where });

    const stats = {
      total: integrations.length,
      active: integrations.filter(i => i.isActive && i.status === ComposioIntegrationStatus.ACTIVE).length,
      byProvider: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    // Count by provider
    integrations.forEach(integration => {
      stats.byProvider[integration.provider] = (stats.byProvider[integration.provider] || 0) + 1;
    });

    // Count by status
    integrations.forEach(integration => {
      stats.byStatus[integration.status] = (stats.byStatus[integration.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Find expired integrations
   */
  async findExpired(): Promise<ComposioIntegration[]> {
    return this.repository
      .createQueryBuilder('integration')
      .where('integration.expires_at IS NOT NULL')
      .andWhere('integration.expires_at < :now', { now: new Date() })
      .andWhere('integration.is_active = :active', { active: true })
      .getMany();
  }

  /**
   * Clean up expired integrations
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(ComposioIntegration)
      .set({
        status: ComposioIntegrationStatus.EXPIRED,
        isActive: false,
      })
      .where('expires_at IS NOT NULL')
      .andWhere('expires_at < :now', { now: new Date() })
      .andWhere('is_active = :active', { active: true })
      .execute();

    return result.affected || 0;
  }
}
