import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { MigrationHelpers } from './utils/migration-helpers';

export class CreateUserTable1700000000000 implements MigrationInterface {
  name = 'CreateUserTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await MigrationHelpers.enableUuidExtension(queryRunner);

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          MigrationHelpers.getUuidPrimaryKeyColumn(),
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'last_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'profile_image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_login',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'composio_auth_config_id',
            type: 'varchar',
            length: '1000',
            isNullable: true,
            comment:
              'Composio authentication configuration ID for OAuth integrations',
          },
          ...MigrationHelpers.getTimestampColumns(),
        ],
        indices: [
          {
            name: 'IDX_users_email',
            columnNames: ['email'],
            isUnique: true,
          },
          {
            name: 'IDX_users_created_at',
            columnNames: ['created_at'],
          },
          {
            name: 'IDX_users_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_users_composio_auth_config_id',
            columnNames: ['composio_auth_config_id'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('users', 'IDX_users_composio_auth_config_id');
    await queryRunner.dropIndex('users', 'IDX_users_is_active');
    await queryRunner.dropIndex('users', 'IDX_users_created_at');
    await queryRunner.dropIndex('users', 'IDX_users_email');

    // Drop table
    await queryRunner.dropTable('users');
  }
}
