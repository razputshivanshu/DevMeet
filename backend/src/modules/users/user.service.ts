import { userRepository, UserRepository } from './user.repository';
import type { UpdateProfileDto } from './user.dto';
import { NotFoundError } from '../../core/errors/app-error';
import { toPublicUser, type PublicUser } from '../auth/auth.service';

export class UserService {
  constructor(private readonly repo: UserRepository = userRepository) {}

  async getById(id: string): Promise<PublicUser> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return toPublicUser(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.repo.update(id, dto);
    return toPublicUser(user);
  }

  async search(query: string, excludeUserId?: string): Promise<PublicUser[]> {
    const users = await this.repo.searchByQuery(query, excludeUserId);
    return users.map(toPublicUser);
  }
}

export const userService = new UserService();
