import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @ApiOperation({ summary: 'Get application info' })
    @ApiResponse({ status: 200, description: 'Application information' })
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Health check result' })
    @ApiQuery({
        name: 'type',
        required: false,
        enum: ['all', 'database', 'api'],
        description: '체크할 서비스 타입'
    })
    healthCheck(@Query('type') type?: string) {
        return this.appService.healthCheck(type);
    }
}
