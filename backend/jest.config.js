const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    ...tsJestTransformCfg,
  },
};
