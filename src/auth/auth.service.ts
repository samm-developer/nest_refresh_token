import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { DatabaseService, UserRecord } from '../database/database.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async register(input: {
    username: string;
    name: string;
    password: string;
  }): Promise<UserRecord | undefined> {
    const password = await this.hashPassword(input.password);

    return this.databaseService.createUser({
      username: input.username,
      name: input.name,
      password,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = await new Promise<Buffer>((resolve, reject) => {
      scryptCallback(password, salt, 64, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      });
    });

    return `scrypt$${salt}$${hash.toString('hex')}`;
  }
}
