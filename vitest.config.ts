import { defineConfig, configDefaults } from "vitest/config";

// vite's resolver cannot load the new `node:sqlite` built-in (it strips the `node:` prefix). Rather
// than fight the bundler, the backend suite (tests/vf-003/vf003.backend.test.ts) is excluded from
// vitest and covered by the plain-node gate `npm run test:vf003:backend` (src/harness/run-backend.ts),
// which drives the identical VF-003 through the persistent driver and proves durability on a fresh
// disk-loaded instance. The excluded file is retained (audit trail) as the intended vitest form.
export default defineConfig({
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "tests/vf-003/vf003.backend.test.ts"],
  },
});
