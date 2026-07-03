/**
 * Engine barrel (facade). The in-memory product engine was split (sprint 016) from one ~660-line file into
 * single-responsibility modules; this file is a thin re-export that preserves the original public import
 * surface so `backend.ts`, the harness, and the tests need no import changes. It is the ONLY place external
 * consumers import from — the internal modules import each other DIRECTLY (never through this barrel), which
 * keeps the dependency graph acyclic:
 *
 *   registry.ts    registry-derived lookup tables + the normalization grammar
 *      |
 *   world.ts       World (records + event log), FactoryRecord/FactoryEvent, state-machine transitions, createGrammarGap
 *      |
 *   projections.ts serialHistory (access-aware), asBuiltProjection, assembleRunCloseReport
 *      |
 *   handlers.ts    the 47 operation handlers (HANDLERS)
 *      |
 *   driver.ts      InMemoryProductDriver (execution boundary, idempotency, rollback) + OperationResult
 *
 * Kept as a deliberate, minimal public-API facade (not a general barrel): Node runs the .ts directly (no
 * bundler, so tree-shaking is moot) and the whole engine loads anyway (no test-time over-inclusion cost); the
 * one real barrel hazard — circular deps — is avoided by the acyclic order above.
 */
export * from "./registry.ts";
export * from "./world.ts";
export * from "./projections.ts";
export * from "./handlers.ts";
export * from "./driver.ts";
