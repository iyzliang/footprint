import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { CollectModule } from './collect/collect.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'footprint'),
        password: configService.get<string>('DB_PASSWORD', 'footprint_secret'),
        database: configService.get<string>('DB_DATABASE', 'footprint'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV', 'development') === 'development',
        logging: configService.get<string>('NODE_ENV', 'development') === 'development',
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    HealthModule,
    AuthModule,
    ProjectModule,
    CollectModule,
  ],
})
export class AppModule {}
