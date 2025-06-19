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
    ApiTags,
} from '@nestjs/swagger';
import { ApiCreateUser, ApiDeleteUser, ApiGetActiveUsers, ApiGetUserById, ApiSearchUsers, ApiUpdateUser } from '../../swagger/decorators/api-user-responses.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiCreateUser(User)
    async createUser(@Body() createUserDto: Partial<User>): Promise<User> {
        return await this.usersService.createUser(createUserDto);
    }

    @Get('search')
    @ApiSearchUsers()
    async searchUsers(
        @Query('q') query: string,
        @Query('limit') limit?: number
    ): Promise<User[]> {
        return await this.usersService.searchUsers(query, limit || 10);
    }

    @Get('active')
    @ApiGetActiveUsers()
    async getActiveUsers(): Promise<User[]> {
        return await this.usersService.findActiveUsers();
    }

    @Get(':id')
    @ApiGetUserById()
    async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<User | null> {
        return await this.usersService.findById(id);
    }

    @Patch(':id')
    @ApiUpdateUser(User)
    async updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: Partial<User>
    ): Promise<User> {
        return await this.usersService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @ApiDeleteUser()
    async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }
}
