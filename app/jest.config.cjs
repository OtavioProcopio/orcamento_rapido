/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(png|jpg|jpeg|svg|gif|webp)$":
      "<rootDir>/src/tests/__mocks__/fileMock.ts",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coverageThreshold: {
    global: {
      branches: 68,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
};
