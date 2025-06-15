/*
 * Конфигурация Jest для тестирования.
 * Использует preset jest-expo и маппинг модулей.
 */
module.exports = {
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^react-native$': 'react-native',
    'zustand/middleware$': '<rootDir>/node_modules/zustand/middleware'
  },
  setupFilesAfterEnv: ['@testing-library/react-native']
};
