import { UserModel, type UserDocument } from '../models/user.model.js';

class UserRepository {
  async upsertByPhoneNumber(phoneNumber: string, displayName?: string): Promise<UserDocument> {
    const update = {
      $set: {
        ...(displayName ? { displayName } : {}),
        lastActivityAt: new Date(),
      },
      $setOnInsert: {
        phoneNumber,
      },
    };

    return UserModel.findOneAndUpdate({ phoneNumber }, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).orFail();
  }
}

export const userRepository = new UserRepository();
