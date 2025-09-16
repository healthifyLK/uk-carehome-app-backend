import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserRole } from '../../../database/models/user.model';
import { Caregiver } from '../../../database/models/caregiver.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Caregiver) private caregiverModel: typeof Caregiver,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'your-secret-key';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    console.log('JWT Strategy - Constructor called');
    console.log('JWT Strategy - Secret configured:', !!jwtSecret);
  }

  async validate(payload: any) {
    console.log('JWT Strategy - validate() called with payload:', payload);
    
    // Check if it's a caregiver token
    if (payload.role === 'CAREGIVER') {
      console.log('JWT Strategy - Processing caregiver token');
      const caregiver = await this.caregiverModel.findByPk(payload.sub, {
        include: ['location'],
      });
      
      console.log('JWT Strategy - Caregiver found:', caregiver ? 'Yes' : 'No');
      
      if (!caregiver || caregiver.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid caregiver or inactive account');
      }
      
      // Return caregiver data in user format for compatibility
      const userData = {
        id: caregiver.id,
        email: caregiver.email,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        role: UserRole.CAREGIVER,
        locationId: caregiver.locationId,
        employeeId: caregiver.employeeId,
        location: caregiver.location,
      };
      
      console.log('JWT Strategy - Returning caregiver user data:', userData);
      return userData;
    }
    
    // Handle regular user tokens
    console.log('JWT Strategy - Processing user token');
    const user = await this.userModel.findByPk(payload.sub, {
      include: ['location'],
    });
    
    console.log('JWT Strategy - User found:', user ? 'Yes' : 'No');
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid user or inactive account');
    }
    
    console.log('JWT Strategy - Returning user data:', user);
    return user;
  }
}