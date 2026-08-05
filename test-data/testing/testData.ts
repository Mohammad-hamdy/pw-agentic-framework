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
  /**
   * Data for the "Add New Project" wizard (specs-plans/osool-add-project.plan.md).
   * Names are timestamped to satisfy the server's name-uniqueness check and to
   * stay recognizable if a cleanup run needs manual follow-up.
   */
  newProject: {
    industryValue: '4', // "Restaurants - مطاعم"
    generateEnglishName: (): string => `QA-AUTO-${Date.now()}`,
    generateArabicName: (): string => `مشروع-آلي-${Date.now()}`,
  },
};
