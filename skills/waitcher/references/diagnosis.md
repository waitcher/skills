# Diagnosing failures

Read when a local, smoke or scheduled run failed or errored.

## Local runs

`run local` (and `config validate --verify`) prints why a run did not pass at the top level: `code`, a `message` in Waitcher terms, the failing `test`, its `trace` and `next`. Do what `next` says; `waitcher explain CODE` has the meaning and fix offline. Hosted run messages start with the same code.

- `APP_UNREACHABLE`: nothing answered at the monitor's target. Start the app there (ask the user how, or use the project's start script), or correct `target`. Hosted runs reach only public addresses.
- `SECRET_UNAVAILABLE`: the script calls `secrets.get(NAME)` without a value. Locally the user exports `NAME` in the shell that runs waitcher; hosted, `waitcher secret set`. The name must be in `settings.envNames`. A value under 6 characters is never registered as a secret: read it with `process.env.NAME` instead.
- `BROWSER_INSTALL_FAILED`: run `waitcher runtime install --browser`, and with `--yes` after the user agrees. A browser run without Chromium downloads it first and says so in `notes`.
- `COLLECTION_ERROR`, `NO_TESTS`: the test file did not load; fix it.
- `ASSERTION_FAILED` and other test codes: the app or the test is wrong; read the trace before changing the test.
- `RUNTIME_INSTALL_FAILED` with npm `EALLOWSCRIPTS` (npm 11): npm got `allow-scripts` from the command line or an `npm_config_allow_scripts` variable. Unset it for the install and record approvals with `npm install-scripts approve esbuild` or `allow-scripts=esbuild` in `.npmrc`. A warning that esbuild's install script was skipped is harmless.
- `CONFIG_DIR_PERMISSIONS`: the session folder is readable by others; the user runs the `chmod` in `next`.

For "since when" or "how often" questions, `waitcher monitor history --id ID` gives 13 months of daily runs, failures, availability and p50/p95 for one monitor, and `waitcher report history` sums the account by month and monitor; individual runs and evidence only go back as far as the plan keeps them.

## Diagnose and reproduce a retained run

Confirm `features.runDiagnosis` for hosted support. Use `run diagnose --id RUN_ID` for a readable hosted packet, or add `--json` for the shared structured report. Use `run diagnose --directory PRIVATE_RUN_DIRECTORY` without an account to inspect indexed local evidence; it starts with the failing test, its code and message and the trace path. Hosted request states come from the controller ledger; local helper observations are explicitly local and do not attest hosted accounting. A known response does not prove task success, and an unknown action may have taken effect. Do not automatically repeat a mutation because its result is unknown.

A historical pass is useful only when the frozen verification policy matches. Changed scripts, targets, deadlines or protected-operation policies cannot supply a matching reference. History searches are bounded; unavailable or truncated history is not proof that the product never passed. Stored artifact checksums are metadata; inspect the actual artifact when needed. Scenario evidence is checked against its recorded checksum before display.

For a completed supported hosted script, `run reproduce --id RUN_ID --output NEW_DIRECTORY` prepares its frozen configuration in a new private folder. It never executes the test or retrieves the current edited monitor. Inspect `monitor.json` and `provenance.json`, then deliberately run `run local --file NEW_DIRECTORY/monitor.json --output FRESH_RUN_DIRECTORY` with the matching installed runtime, optionally `--runtime PROJECT`. Reproduction is a fresh run with separate provenance and does not replace the original evidence.

Managed product credentials, AI keys and browser sessions are not exported. Supply existing private local mappings with `--http-credentials-file`, `--connections-file` and `--browser-identities-file` where required. Authored scripts and literal configuration can themselves be sensitive, so keep the reproduction private. Operator-injected headers, bodies or environment state make this initial portable preparation unavailable rather than silently changing the test. Older local runs without an indexed frozen manifest remain inspectable but cannot establish a captured reproduction policy.
