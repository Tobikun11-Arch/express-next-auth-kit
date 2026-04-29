"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRepository = void 0;
const Admin_model_1 = require("../models/Admin.model");
exports.adminRepository = {
    findByEmail: (email) => Admin_model_1.AdminModel.findOne({ email: email.toLowerCase() }).exec(),
    findByEmailOrUsername: (identifier) => Admin_model_1.AdminModel.findOne({
        $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
    }).exec(),
    findById: (id) => Admin_model_1.AdminModel.findById(id).exec(),
    create: (data) => Admin_model_1.AdminModel.create(data)
};
