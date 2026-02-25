import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities';
import { UpdateProfileDto, UpdatePasswordDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      select: ['id', 'email', 'nickname', 'createdAt', 'updatedAt'],
    });

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.userRepository.update(userId, {
      ...(dto.nickname !== undefined && { nickname: dto.nickname }),
    });

    return this.getProfile(userId);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    return { message: 'Password updated successfully' };
  }
}
