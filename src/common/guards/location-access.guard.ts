import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../database/models';

@Injectable()
export class LocationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

     // Check if user exists
     if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }


    // Check if user has locationId
    if (!user.locationId) {
      throw new UnauthorizedException('User location not found');
    }

    return true;
  }
}