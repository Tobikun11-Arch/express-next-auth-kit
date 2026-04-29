"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const error_1 = require("../utils/error");
const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const flattened = result.error.flatten();
        const firstFieldError = Object.values(flattened.fieldErrors)
            .flat()
            .filter(Boolean)[0];
        const firstFormError = flattened.formErrors.filter(Boolean)[0];
        const message = firstFieldError ?? firstFormError ?? 'Invalid request';
        return next(new error_1.ApiError(400, 'VALIDATION_ERROR', message, flattened));
    }
    next();
};
exports.validate = validate;
