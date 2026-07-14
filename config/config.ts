import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import 'module-alias/register';

/**
 * Loads the environment file that matches the ENV variable (defaults to "testing").
 * Mirrors the per-environment dotenv strategy used across the QE framework.
 */
function loadConfig(): void {
  const envFile = process.env.ENV ? `.env.${process.env.ENV}` : '.env.testing';
  const envPath = path.resolve(__dirname, `./${envFile}`);
  console.log(`Loading environment variables from: ${envPath}`);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.error(`.env file not found at: ${envPath}`);
  }
}

const language: string = process.env.LANGUAGE || 'en';

/**
 * Loads a localized file by feature name, falling back to English when the
 * requested language file is missing. Locale files export a default object.
 */
function loadLocaleFile(fileName: string): Record<string, any> {
  const lang = process.env.LANGUAGE || 'en';
  try {
    const fullPath = path.resolve(__dirname, `../locales/${lang}/${fileName}.ts`);
    return require(fullPath).default;
  } catch (error: any) {
    if (lang !== 'en') {
      try {
        const fallbackPath = path.resolve(__dirname, `../locales/en/${fileName}.ts`);
        console.log(`Loading fallback locale file: ${fallbackPath}`);
        return require(fallbackPath).default;
      } catch (fallbackError: any) {
        console.error(`Fallback locale load failed: ${fallbackError.message}`);
      }
    }
    console.error(`Failed to load locale file: ${fileName}.ts for language: ${lang}`);
    return {};
  }
}

const getLocale = (fileName: string): Record<string, any> => loadLocaleFile(fileName);

/**
 * Loads per-environment test data (test-data/<env>/testData.ts).
 */
function loadTestData(): Record<string, any> {
  const env = process.env.ENV || 'testing';
  const testDataPath = path.resolve(__dirname, `../test-data/${env}/testData.ts`);
  try {
    return require(testDataPath).default;
  } catch (error: any) {
    console.error(`Failed to load test data for environment ${env}: ${error.message}`);
    return {};
  }
}

const getTestData = loadTestData();

/**
 * Runtime configuration. Uses getters so each value is read from process.env at
 * access time — after playwright.config.ts calls loadConfig() (dotenv). Reading
 * process.env eagerly here would capture undefined, because this module is
 * imported before the .env file is loaded.
 */
const config = {
  get baseUrl(): string | undefined {
    return process.env.BASE_URL;
  },
  get apiUrl(): string | undefined {
    return process.env.BASE_API;
  },
  get environment(): string | undefined {
    return process.env.ENV;
  },
  get language(): string {
    return process.env.LANGUAGE || 'en';
  },
  get apiKey(): string | undefined {
    return process.env.API_KEY;
  },
};

export default {
  loadConfig,
  getLocale,
  config,
  language,
  getTestData,
};
