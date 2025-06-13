import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

@Injectable()
export class MongoDBConfig implements MongooseOptionsFactory {
    constructor(private readonly configService: ConfigService) { }

    createMongooseOptions(): MongooseModuleOptions {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        console.log(this.configService.get<string>('MONGODB_URI'));
        return {
            uri: this.configService.get<string>('MONGODB_URI'),
            maxPoolSize: this.configService.get<number>('MONGODB_MAX_POOL_SIZE', 10),
            serverSelectionTimeoutMS: this.configService.get<number>(
                'MONGODB_SERVER_SELECTION_TIMEOUT',
                5000
            ),
            socketTimeoutMS: this.configService.get<number>('MONGODB_SOCKET_TIMEOUT', 45000),
            autoIndex: !isProduction,
        };
    }

    public validateMongoDBConfig(): void {
        const requiredVars = ['MONGODB_URI'];

        for (const variable of requiredVars) {
            if (!this.configService.get(variable)) {
                throw new Error(`Missing required MongoDB environment variable: ${variable}`);
            }
        }
    }
}
