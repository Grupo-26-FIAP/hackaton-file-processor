import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateVideoJobsTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'video_jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: "'processing'",
          },
          {
            name: 'input_bucket',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'input_key',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'output_bucket',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'output_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_video_jobs_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_video_jobs_created_at',
            columnNames: ['created_at'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('video_jobs');
  }
}
