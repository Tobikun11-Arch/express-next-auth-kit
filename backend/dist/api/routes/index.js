"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = (0, express_1.default)();
router.use('/auth', auth_routes_1.default);
// router.use('/products', productRoutes); -> if you have more routes, you can add them here
exports.default = router;
