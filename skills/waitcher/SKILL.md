---
name: waitcher
description: Set up and maintain Waitcher monitoring from a repository with the waitcher CLI. Use to turn a product's critical journeys into HTTP, certificate, heartbeat, API, browser or visual monitors in waitcher.json, verify them locally, deploy them through a reviewed plan, and diagnose failures from real evidence.
---

# Waitcher

You operate the waitcher CLI for the user. The repository is the source of truth: `waitcher.json` declares the monitors of one project per environment, test files hold the scripts, and `waitcher deploy` reconciles one environment at a time. Commands print JSON on stdout (`run diagnose` and `run scenarios` need `--json` for it); failures print `{error:{code,message}}` on stderr. Read the exit code, every `issues` entry and every `next` step.

This skill says what to do and in which order. For exact syntax use the installed CLI, never memory: `waitcher help TOPIC` (for example `help deploy`, `help secret`, `help run`) prints only that part of the help for this CLI version, and `waitcher explain CODE` explains an issue or error code. The user guide at https://waitcher.dev/docs/ explains the same product for people; link the user to a page (CLI install and updates, alerts, access tokens, account) instead of retelling it.

## Rules

- Never put secrets in files, arguments or output. Pipe values to `--value-stdin`.
- Keep new monitors paused. Pass `--activate-new`, `--prune`, `--adopt` or `--smoke` only when the user agreed to that effect.
- Show the user the plan's `changes` before `deploy apply`, and apply with `--based-on` from that plan.
- A local pass is not hosted permission. If capabilities or limits refuse something, report it; never switch accounts, raise limits or remove assertions to get a green result.
- An agent's own success claim is not evidence. Verify outcomes through the product's state or real run evidence.
- Do not turn a whole regression suite into monitors. Pick two to five journeys whose failure the user would act on.

## Workflow

1. **Check the setup.** Run `waitcher doctor` in the repository. Fix `error` checks first; its `next` lists exact commands. Without a session, ask the user to run `waitcher auth login` (CI uses a token).
2. **Understand the product.** Read the repository: base URLs per environment, existing E2E tests, critical journeys, test accounts and jobs. Ask the user which failures should alert them.
3. **Start the file.** `waitcher config init --project-name NAME --target https://BASE` when there is no `waitcher.json`. Give each monitor a stable lowercase `key`; changing a key later replaces the monitor and its history.
4. **Choose types.** `http` for status and content, `certificate` for TLS expiry, `heartbeat` for jobs that report in, `api` for a multi-request invariant, `browser` for a user journey. `waitcher monitor init --type TYPE --file x.json` prints a complete example of any type. Script monitors name their test with `entry`; read [authoring](references/authoring.md) before writing one. They need the pinned runtime next to `waitcher.json`: run `waitcher runtime install`, show the user the steps it lists (npm install runs package install scripts; browser projects download Chromium), and after they agree rerun it with `--yes`. It writes exact pins into `package.json`, updates `.gitignore` and is safe to repeat. The same command upgrades the project after a CLI update (`RUNTIME_VERSION_OUTDATED`).
5. **Validate offline.** `waitcher config validate` resolves every environment and builds every entry. Fix each issue at its `path`. Add `--env NAME --verify` (optionally `--key KEY`) to run the api/browser entries locally without an account; read the run directory it names when one fails.
6. **Plan.** `waitcher deploy plan --env NAME --verify` runs script monitors locally against that environment, then asks the server. Resolve errors (`SECRET_MISSING`: ask the user for the value and run `waitcher secret set`; `ADOPTION_CANDIDATE`: ask whether the existing monitor is the same check).
7. **Apply.** After the user accepts the plan: `waitcher deploy apply --env NAME --based-on BASED_ON`, where BASED_ON is the plan's `basedOn` or `none` when it is null (first deploy); the plan's `next` prints the exact command. Add `--smoke` for one hosted run per changed monitor. New monitors stay paused.
8. **Report.** Give the user the monitor IDs, what each checks, local and hosted results, evidence paths and anything still pending (paused schedules, heartbeat credentials, secrets for other environments). If `waitcher alert policy list` shows no routing, failures will alert nobody: point the user to https://waitcher.dev/docs/alerts.

For CI, `waitcher ci init` writes a workflow that plans on pull requests and applies on the main branch. Details of secrets, adoption, rollback and CI are in [deploy](references/deploy.md).

## When something fails

- `waitcher --help` prints a short overview of topics; `waitcher help TOPIC` (or `waitcher GROUP --help`) prints one part with the exit codes; `waitcher help all` is long, avoid it.
- Exit 2: fix the file or input; exit 3: sign in; exit 4: a check failed (inspect evidence); exit 6: quota, rate or queue limit; exit 7: not permitted; exit 8: conflict or managed by `waitcher.json`; exit 9: not found; exit 10: service unavailable.
- For a failed run, read [diagnosis](references/diagnosis.md): `waitcher run diagnose --id RUN_ID`, then reproduce locally before changing the test.
- Never retry a write automatically after an uncertain result; read the current state first.

## References

- [authoring](references/authoring.md): choosing a type, writing API and browser tests, local runs and evidence, single-monitor apply.
- [deploy](references/deploy.md): waitcher.json details, secrets, adoption, rollback, CI.
- [diagnosis](references/diagnosis.md): run diagnosis and reproduction.
- [optional capabilities](references/optional-capabilities.md): visual baselines, browser identities, verified HTTP credentials, invocation budgets.
- [AI and agents](references/ai-and-agents.md): agent outcome checks, scenario evidence, AI endpoints and suites, calibration, AI steps in scripts, protected requests.
- Read the last two only when `waitcher system capabilities` reports the feature and the user needs it.
