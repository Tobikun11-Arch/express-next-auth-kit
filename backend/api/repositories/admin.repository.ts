import {AdminModel, AdminDocument} from '../models/Admin.model';

export const adminRepository = {
  findByEmail: (email: string) =>
    AdminModel.findOne({email: email.toLowerCase()}).exec(),

  findByEmailOrUsername: (identifier: string) =>
    AdminModel.findOne({
      $or: [{email: identifier.toLowerCase()}, {username: identifier}]
    }).exec(),

  findById: (id: string) => AdminModel.findById(id).exec(),

  create: (data: Partial<AdminDocument>) => AdminModel.create(data)
};