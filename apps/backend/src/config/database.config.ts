import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig = (): TypeOrmModuleOptions => {
  const baseConfig = {
    type: 'postgres' as const,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // synchronize: process.env.NODE_ENV !== 'production',
    synchronize: true,
  };

  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
    };
  }

  // 개발 환경 설정
  return {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'taskflow_dev',
    ssl: false,
  };
};
