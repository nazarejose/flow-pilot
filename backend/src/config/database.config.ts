import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  isTest = false,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || `${isTest ? 5433 : 5432}`, 10),
  username: process.env.DB_USERNAME || 'helpdesk',
  password: process.env.DB_PASSWORD || 'helpdesk123',
  database: process.env.DB_DATABASE || (isTest ? 'helpdesk_test' : 'helpdesk_dev'),
  autoLoadEntities: true,
  synchronize: isTest,
  dropSchema: isTest,
});
