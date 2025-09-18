import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordGeneratorUtil {
  private readonly charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  generatePassword(length: number = 12): string {
    let password = '';
    for (let i = 0; i < length; i++) {
      password += this.charset.charAt(Math.floor(Math.random() * this.charset.length));
    }
    return password;
  }

  generateSecurePassword(): string {
    // Ensure password has at least one of each required character type
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill the rest with random characters
    for (let i = 4; i < 12; i++) {
      password += this.charset.charAt(Math.floor(Math.random() * this.charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}