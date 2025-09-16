import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { CaregiverAuthController } from './caregiver-auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../../database/models/user.model';
import { Caregiver } from 'src/database/models/caregiver.model';
import { Location } from 'src/database/models/location.model';
import { AuditModule } from '../audit/audit.module';
import { CaregiverAuthService } from './caregiver-auth.service';
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([User,Caregiver,Location]),
    AuditModule,
  ],
  controllers: [AuthController,CaregiverAuthController],
  providers: [AuthService, CaregiverAuthService,JwtStrategy],
  exports: [AuthService,CaregiverAuthService],
})
export class AuthModule {}