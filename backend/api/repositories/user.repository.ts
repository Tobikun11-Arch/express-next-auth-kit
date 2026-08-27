import {UserDocument, UserModel} from '../models/User.model';

export const userRepository = {
  findByEmail: (email: string) =>
    UserModel.findOne({email: email.toLowerCase()}).exec(),

  findById: (id: string) => UserModel.findById(id).exec(),

  listAll: () => UserModel.find({}).exec(),

  create: (data: Partial<UserDocument>) => UserModel.create(data),

  updateProfile: (
    userId: string,
    data: Partial<
      Pick<
        UserDocument,
        'firstName' | 'lastName' | 'username' | 'email'
      >
    >
  ) => UserModel.updateOne({_id: userId}, data).exec(),

  updatePassword: (userId: string, passwordHash: string) =>
    UserModel.updateOne({_id: userId}, {passwordHash}).exec(),

  setVerificationCode: (email: string, code: string, expiry: Date) =>
    UserModel.updateOne(
      {email: email.toLowerCase()},
      {verificationCode: code, verificationExpiry: expiry}
    ).exec(),

  clearVerificationCode: (email: string) =>
    UserModel.updateOne(
      {email: email.toLowerCase()},
      {verificationCode: null, verificationExpiry: null}
    ).exec(),

  setResetCode: (email: string, code: string, expiry: Date) =>
    UserModel.updateOne(
      {email: email.toLowerCase()},
      {resetCode: code, resetExpiry: expiry}
    ).exec(),

  clearResetCode: (email: string) =>
    UserModel.updateOne(
      {email: email.toLowerCase()},
      {resetCode: null, resetExpiry: null}
    ).exec(),

  markVerified: (email: string) =>
    UserModel.updateOne(
      {email: email.toLowerCase()},
      {isVerified: true, verificationCode: null, verificationExpiry: null}
    ).exec()
};