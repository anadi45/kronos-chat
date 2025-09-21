import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';
import { MigrationHelpers } from './utils/migration-helpers';

export class CreateComposioOAuthTable1700000000002 implements MigrationInterface {
  name = 'CreateComposioOAuthTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await MigrationHelpers.enableUuidExtension(queryRunner);

    // Create composio_oauth table
    await queryRunner.createTable(
      new Table({
        name: 'composio_oauth',
        columns: [
          MigrationHelpers.getUuidPrimaryKeyColumn(),
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key reference to users table',
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Integration platform (e.g., GMAIL, SLACK, NOTION)',
          },
          {
            name: 'auth_config_id',
            type: 'varchar',
            length: '1000',
            isNullable: false,
            comment: 'Composio authentication configuration ID',
          },
          ...MigrationHelpers.getTimestampColumns(),
        ],
        indices: [
          {
            name: 'IDX_composio_oauth_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_composio_oauth_platform',
            columnNames: ['platform'],
          },
          {
            name: 'IDX_composio_oauth_user_platform',
            columnNames: ['user_id', 'platform'],
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

    // Drop index on composio_auth_config_id before dropping the column
    await queryRunner.dropIndex('users', 'IDX_users_composio_auth_config_id');
    
    // Remove composio_auth_config_id column from users table
    await queryRunner.dropColumn('users', 'composio_auth_config_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back composio_auth_config_id column to users table
    await queryRunner.addColumn('users', new TableColumn({
      name: 'composio_auth_config_id',
      type: 'varchar',
      length: '1000',
      isNullable: true,
    }));

    // Recreate the index on composio_auth_config_id
    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_users_composio_auth_config_id',
      columnNames: ['composio_auth_config_id'],
    }));

    // Drop indexes
    await queryRunner.dropIndex('composio_oauth', 'IDX_composio_oauth_user_platform');
    await queryRunner.dropIndex('composio_oauth', 'IDX_composio_oauth_platform');
    await queryRunner.dropIndex('composio_oauth', 'IDX_composio_oauth_user_id');

    // Drop table
    await queryRunner.dropTable('composio_oauth');
  }
}
