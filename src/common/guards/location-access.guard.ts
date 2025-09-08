import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../database/models';

@Injectable()
export class LocationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const locationId = request.params.locationId || request.body.locationId;

    // Super Admin has access to all locations
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin and other roles can only access their assigned location
    if (user.locationId && user.locationId !== locationId) {
      throw new ForbiddenException('Access denied to this location');
    }

    return true;
  }
}