module.exports = {
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^react-native$': 'react-native',
    'zustand/middleware$': '<rootDir>/node_modules/zustand/middleware'
  },
  setupFilesAfterEnv: ['@testing-library/react-native']
};
