import mongoose from 'mongoose';
import {BaseUserDocument, createBaseUserSchema} from './base/BaseUser.schema';

export interface AdminDocument extends BaseUserDocument {}

const AdminSchema = createBaseUserSchema<AdminDocument>();

export const AdminModel = mongoose.model<AdminDocument>(
  'Admin',
  AdminSchema,
  'admins'
);