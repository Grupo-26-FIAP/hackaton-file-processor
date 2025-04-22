import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

export const adminSeed = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  const adminExists = await userRepository.findOne({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      username: 'admin',
      password: hashedPassword,
      roles: ['admin'],
      isActive: true,
    });

    await userRepository.save(admin);
    console.log('Admin user created successfully');
  }
};
