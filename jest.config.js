module.exports = {
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^react-native$': 'react-native'
  },
  setupFilesAfterEnv: ['@testing-library/react-native']
};
