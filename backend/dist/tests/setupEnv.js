"use strict";
var _a, _b, _c, _d;
(_a = process.env).MONGO_URI ?? (_a.MONGO_URI = 'mongodb://localhost:27017/test');
(_b = process.env).JWT_SECRET ?? (_b.JWT_SECRET = 'test-jwt-secret');
(_c = process.env).JWT_REFRESH_SECRET ?? (_c.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret');
(_d = process.env).NODE_ENV ?? (_d.NODE_ENV = 'test');
