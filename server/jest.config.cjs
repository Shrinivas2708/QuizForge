/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use the ESM preset because this package.json sets "type": "module"
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
