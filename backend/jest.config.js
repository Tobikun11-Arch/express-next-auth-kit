const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  testTimeout: 60000,
  forceExit: true,
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/dist/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  transform: {
    ...tsJestTransformCfg,
  },
};
