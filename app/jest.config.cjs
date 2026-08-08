/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  // Espelha o `define` do vite.config.ts para código que roda em testes.
  globals: {
    __APP_BASENAME__: "/",
  },
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
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/playwright/"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
