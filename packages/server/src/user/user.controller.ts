import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto, UpdatePasswordDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: { user: { id: string } }) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Put('password')
  @ApiOperation({ summary: 'Update current user password' })
  updatePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(req.user.id, dto);
  }
}
