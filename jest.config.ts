import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '/node_modules/',
    '/out/',
    '/dist/',
    '/lib/'
  ],
  collectCoverage: false,
  transform: {
    '^.+\\.(ts|tsx)?$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [
            'TS151001'
          ]
        }
      }
    ],
  }
}

export default config
