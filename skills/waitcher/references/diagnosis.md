# Diagnosing failures

Read when a local, smoke or scheduled run failed or errored.

For "since when" or "how often" questions, `waitcher monitor history --id ID` gives 13 months of daily runs, failures, availability and p50/p95 for one monitor, and `waitcher report history` sums the account by month and monitor; individual runs and evidence only go back as far as the plan keeps them.

## Diagnose and reproduce a retained run

Confirm `features.runDiagnosis` for hosted support. Use `run diagnose --id RUN_ID` for a readable hosted packet, or add `--json` for the shared structured report. Use `run diagnose --directory PRIVATE_RUN_DIRECTORY` without an account to inspect indexed local evidence. Hosted request states come from the controller ledger; local helper observations are explicitly local and do not attest hosted accounting. A known response does not prove task success, and an unknown action may have taken effect. Do not automatically repeat a mutation because its result is unknown.

A historical pass is useful only when the frozen verification policy matches. Changed scripts, targets, deadlines or protected-operation policies cannot supply a matching reference. History searches are bounded; unavailable or truncated history is not proof that the product never passed. Stored artifact checksums are metadata; inspect the actual artifact when needed. Scenario evidence is checked against its recorded checksum before display.

For a completed supported hosted script, `run reproduce --id RUN_ID --output NEW_DIRECTORY` prepares its frozen configuration in a new private folder. It never executes the test or retrieves the current edited monitor. Inspect `monitor.json` and `provenance.json`, then deliberately run `run local --file NEW_DIRECTORY/monitor.json --output FRESH_RUN_DIRECTORY` with the matching installed runtime, optionally `--runtime PROJECT`. Reproduction is a fresh run with separate provenance and does not replace the original evidence.

Managed product credentials, AI keys and browser sessions are not exported. Supply existing private local mappings with `--http-credentials-file`, `--connections-file` and `--browser-identities-file` where required. Authored scripts and literal configuration can themselves be sensitive, so keep the reproduction private. Operator-injected headers, bodies or environment state make this initial portable preparation unavailable rather than silently changing the test. Older local runs without an indexed frozen manifest remain inspectable but cannot establish a captured reproduction policy.
