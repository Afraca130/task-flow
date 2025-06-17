import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    async createUser(@Body() createUserDto: Partial<User>): Promise<User> {
        return await this.usersService.createUser(createUserDto);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search users by name or email' })
    @ApiQuery({ name: 'q', description: 'Search query for name or email', required: true })
    @ApiQuery({ name: 'limit', description: 'Number of results to return', required: false })
    @ApiResponse({ status: 200, description: 'Search results returned successfully' })
    async searchUsers(
        @Query('q') query: string,
        @Query('limit') limit?: number
    ): Promise<User[]> {
        return await this.usersService.searchUsers(query, limit || 10);
    }

    @Get('active')
    @ApiOperation({ summary: 'Get all active users' })
    @ApiResponse({ status: 200, description: 'Active users retrieved successfully' })
    async getActiveUsers(): Promise<User[]> {
        return await this.usersService.findActiveUsers();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<User | null> {
        return await this.usersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    async updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: Partial<User>
    ): Promise<User> {
        return await this.usersService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }
}
