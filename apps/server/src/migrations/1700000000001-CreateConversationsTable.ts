import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { MigrationHelpers } from './utils/migration-helpers';

export class CreateConversationsTable1700000000001 implements MigrationInterface {
  name = 'CreateConversationsTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await MigrationHelpers.enableUuidExtension(queryRunner);

    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          MigrationHelpers.getUuidPrimaryKeyColumn(),
          {
            name: 'title',
            type: 'text',
            isNullable: true,
            comment: 'Optional title for the conversation',
          },
          {
            name: 'messages',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'",
            comment: 'Array of message objects with content, role, and timestamp',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
            comment: 'Additional metadata for the conversation',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
            comment: 'User ID who created the conversation',
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: false,
            comment: 'User ID who last updated the conversation',
          },
          ...MigrationHelpers.getTimestampColumns(),
        ],
        indices: [
          {
            name: 'IDX_conversations_created_by',
            columnNames: ['created_by'],
          },
          {
            name: 'IDX_conversations_updated_by',
            columnNames: ['updated_by'],
          },
        ],
        foreignKeys: [
          {
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['updated_by'],
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
    // Drop indexes
    await queryRunner.dropIndex('conversations', 'IDX_conversations_updated_by');
    await queryRunner.dropIndex('conversations', 'IDX_conversations_created_by');

    // Drop table
    await queryRunner.dropTable('conversations');
  }
}
