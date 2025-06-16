import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfileColorToUser1703000000000 implements MigrationInterface {
    name = 'AddProfileColorToUser1703000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'profile_color',
            type: 'varchar',
            length: '7',
            default: "'#3B82F6'",
            isNullable: false,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'profile_color');
    }
}
