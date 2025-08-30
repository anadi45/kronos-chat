import { QueryRunner } from 'typeorm';

/**
 * Helper functions for common migration operations
 */
export class MigrationHelpers {
  /**
   * Create a standard timestamp columns (created_at, updated_at)
   */
  static getTimestampColumns() {
    return [
      {
        name: 'created_at',
        type: 'timestamptz',
        default: 'CURRENT_TIMESTAMP',
        isNullable: false,
      },
      {
        name: 'updated_at',
        type: 'timestamptz',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        isNullable: false,
      },
    ];
  }

  /**
   * Create a standard UUID primary key column
   */
  static getUuidPrimaryKeyColumn(name: string = 'id') {
    return {
      name,
      type: 'uuid',
      isPrimary: true,
      generationStrategy: 'uuid' as const,
      default: 'uuid_generate_v4()',
    };
  }

  /**
   * Enable UUID extension if not exists
   */
  static async enableUuidExtension(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }
}
