import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // Use process.env directly with fallback to ConfigService
  const getEnvVar = (key: string, defaultValue?: any) => {
    return process.env[key] || configService.get(key, defaultValue);
  };

  console.log('🔧 Database Configuration:');
  console.log(`  - Host: ${getEnvVar('DB_HOST', 'localhost')}`);
  console.log(`  - Port: ${getEnvVar('DB_PORT', 5432)}`);
  console.log(`  - Database: ${getEnvVar('DB_DATABASE', 'taskflow')}`);
  console.log(`  - Username: ${getEnvVar('DB_USERNAME', 'taskflow')}`);
  console.log(`  - Logging: ${getEnvVar('DB_LOGGING', 'false')}`);
  console.log(`  - Environment: ${getEnvVar('NODE_ENV', 'development')}`);

  return {
    type: 'postgres',
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '5432'), 10),
    username: getEnvVar('DB_USERNAME', 'taskflow'),
    password: getEnvVar('DB_PASSWORD', 'taskflow'),
    database: getEnvVar('DB_DATABASE', 'taskflow'),

    // Use path-based entity loading for better performance and flexibility
    entities: [
      path.join(__dirname, '../**/*.entity{.ts,.js}'),
    ],

    // Migration settings
    migrations: [
      path.join(__dirname, '../database/migrations/*{.ts,.js}'),
    ],

    // Database synchronization (use false in production)
    synchronize: getEnvVar('NODE_ENV') !== 'production',
    logging: getEnvVar('DB_LOGGING', 'false') === 'true',

    // SSL configuration for production
    ssl: getEnvVar('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,

    // Connection pool settings
    extra: {
      max: parseInt(getEnvVar('DB_MAX_CONNECTIONS', '10'), 10),
      idleTimeoutMillis: parseInt(getEnvVar('DB_IDLE_TIMEOUT', '30000'), 10),
      connectionTimeoutMillis: parseInt(getEnvVar('DB_CONNECTION_TIMEOUT', '2000'), 10),
    },

    // Retry settings
    retryAttempts: parseInt(getEnvVar('DB_RETRY_ATTEMPTS', '3'), 10),
    retryDelay: parseInt(getEnvVar('DB_RETRY_DELAY', '3000'), 10),

    // Auto-load entities (TypeORM will automatically discover entities)
    autoLoadEntities: true,

    // Connection pool keepalive
    keepConnectionAlive: true,
  };
};
