import { resolve } from 'path';
import type { ExpoConfig } from 'expo/config';

const rootEnvPath = resolve(__dirname, '../../.env');
const envResult = require('dotenv').config({ path: rootEnvPath });

if (envResult.parsed) {
  process.env = { ...process.env, ...envResult.parsed };
}

export default ({ config }: { config: ExpoConfig }) => config;
