import { User, IUser } from './user.schema';

export const findUserById = async (userId: string): Promise<IUser | null> => {
  return await User.findById(userId);
};

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email });
};

export const updateUser = async (userId: string, data: Partial<IUser>): Promise<IUser | null> => {
  return await User.findByIdAndUpdate(userId, data, { returnDocument: 'after', runValidators: true });
};

export const deleteUser = async (userId: string): Promise<IUser | null> => {
  // Hard delete for now, or you could add a deletedAt field for soft delete
  return await User.findByIdAndDelete(userId);
};

export const getAllUsers = async (): Promise<IUser[]> => {
  return await User.find({}, '-password_hash');
};
