/**
 * Per-environment test data for the Osool app. Loaded by config.ts based on ENV.
 * The valid password is a secret — it is read lazily from SUPERADMIN_PASSWORD in
 * config/.env.testing (never hardcoded here).
 */
export default {
  validUser: {
    email: process.env.SUPERADMIN_EMAIL || 'superadmin@osool.sa',
    get password(): string {
      return process.env.SUPERADMIN_PASSWORD || '';
    },
  },
  invalidUser: {
    email: 'wrong@osool.sa',
    password: 'WrongPass123',
  },
};
