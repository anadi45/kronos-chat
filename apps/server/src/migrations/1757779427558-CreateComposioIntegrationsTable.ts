import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from './utils/migration-helpers';

export class CreateComposioIntegrationsTable1757779427558 implements MigrationInterface {
  name = 'CreateComposioIntegrationsTable1757779427558';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await MigrationHelpers.enableUuidExtension(queryRunner);

    // Create composio_integrations table
    await queryRunner.createTable(
      new Table({
        name: 'composio_integrations',
        columns: [
          MigrationHelpers.getUuidPrimaryKeyColumn(),
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'composio_auth_config_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'composio_connection_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'INITIATED'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'connected_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          ...MigrationHelpers.getTimestampColumns(),
        ],
        indices: [
          {
            name: 'IDX_composio_integrations_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_composio_integrations_provider',
            columnNames: ['provider'],
          },
          {
            name: 'IDX_composio_integrations_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_composio_integrations_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_composio_integrations_composio_connection_id',
            columnNames: ['composio_connection_id'],
            isUnique: true,
          },
          {
            name: 'IDX_composio_integrations_user_provider',
            columnNames: ['user_id', 'provider'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    const table = await queryRunner.getTable('composio_integrations');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('composio_integrations', foreignKey);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('composio_integrations', 'IDX_composio_integrations_user_provider');
    await queryRunner.dropIndex('composio_integrations', 'IDX_composio_integrations_composio_connection_id');
    await queryRunner.dropIndex('composio_integrations', 'IDX_composio_integrations_is_active');
    await queryRunner.dropIndex('composio_integrations', 'IDX_composio_integrations_status');
    await queryRunner.dropIndex('composio_integrations', 'IDX_composio_integrations_provider');
    await queryRunner.dropIndex('composio_integrations', 'IDX_composio_integrations_user_id');

    // Drop table
    await queryRunner.dropTable('composio_integrations');
  }
}
