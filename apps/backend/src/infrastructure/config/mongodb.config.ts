import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

/**
 * MongoDB 데이터베이스 설정 서비스
 */
@Injectable()
export class MongoDbConfig implements MongooseOptionsFactory {
  constructor(private readonly configService: ConfigService) { }

  createMongooseOptions(): MongooseModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // MongoDB Mongoose 디버그 모드 설정 (개발 환경에서만)
    if (!isProduction && this.configService.get<boolean>('MONGOOSE_DEBUG', false)) {
      const mongoose = require('mongoose');
      mongoose.set('debug', true);
    }

    return {
      uri: this.configService.get<string>(
        'MONGODB_URI',
        'mongodb://taskflow:taskflow@localhost:27017/taskflow?authSource=admin'
      ),

      // 연결 설정
      maxPoolSize: this.configService.get<number>('MONGODB_MAX_POOL_SIZE', 10),
      serverSelectionTimeoutMS: this.configService.get<number>('MONGODB_SERVER_SELECTION_TIMEOUT', 5000),
      socketTimeoutMS: this.configService.get<number>('MONGODB_SOCKET_TIMEOUT', 45000),

      // 연결 안정성 설정
      retryWrites: true,
      retryReads: true,
    };
  }

  /**
   * MongoDB 연결 설정 검증
   */
  public validateMongoDbConfig(): void {
    const uri = this.getMongoDbUri();

    if (!uri) {
      throw new Error('Missing required MongoDB environment variable: MONGODB_URI');
    }

    console.log('📊 MongoDB Configuration validated successfully');
    console.log(`📊 MongoDB URI: ${uri.replace(/\/\/.*:.*@/, '//****:****@')}`); // 비밀번호 마스킹
  }

  /**
   * MongoDB URI 반환
   */
  public getMongoDbUri(): string {
    return this.configService.get<string>(
      'MONGODB_URI',
      'mongodb://taskflow:taskflow@localhost:27017/taskflow?authSource=admin'
    );
  }
}
