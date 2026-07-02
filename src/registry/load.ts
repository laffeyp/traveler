// Registry loader. Reads the 11 contract registries + the VF-003 reference manifest
// from disk and parses them. Pure I/O; no validation (that is validate.ts).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const ROOT = process.cwd();

export function readYaml(relPath: string): any {
  const text = readFileSync(join(ROOT, relPath), "utf8");
  return parse(text);
}

export interface Registries {
  modules: any;
  records: any;
  operations: any;
  events: any;
  stateMachines: any;
  projections: any;
  reports: any;
  runCloseRules: any;
  scenarioAssertions: any;
  observabilityProfiles: any;
  compatibilityProfiles: any;
  vf003: any;
}

export function loadRegistries(): Registries {
  return {
    modules: readYaml("contracts/modules.yaml"),
    records: readYaml("contracts/records.yaml"),
    operations: readYaml("contracts/operations.yaml"),
    events: readYaml("contracts/events.yaml"),
    stateMachines: readYaml("contracts/state-machines.yaml"),
    projections: readYaml("contracts/projections.yaml"),
    reports: readYaml("contracts/reports.yaml"),
    runCloseRules: readYaml("contracts/run-close-rules.yaml"),
    scenarioAssertions: readYaml("contracts/scenario-assertions.yaml"),
    observabilityProfiles: readYaml("contracts/observability-profiles.yaml"),
    compatibilityProfiles: readYaml("contracts/compatibility-profiles.yaml"),
    vf003: readYaml("scenarios/VF-003/references.yaml"),
  };
}
