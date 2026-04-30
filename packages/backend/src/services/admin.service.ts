import bcrypt from 'bcryptjs';
import { adminRepository } from '../repositories/admin.repository.js';
import { AppError } from '../middleware/error-handler.js';

export const adminService = {
  async createAdmin(storeId: number, username: string, password: string) {
    // Check duplicate
    const existing = adminRepository.findByStoreAndUsername(storeId, username);
    if (existing) {
      throw new AppError(409, 'USERNAME_EXISTS', 'Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return adminRepository.create({ storeId, username, passwordHash });
  },

  getAdminsByStore(storeId: number) {
    return adminRepository.findAllByStore(storeId);
  },
};
