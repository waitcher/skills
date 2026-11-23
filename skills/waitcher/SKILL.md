---
name: waitcher
description: Set up and maintain Waitcher monitoring from a repository with the waitcher CLI. Use to turn a product's critical journeys into HTTP, certificate, TCP, DNS, heartbeat, API, browser, visual or MCP monitors in waitcher.json, verify them locally, deploy them through a reviewed plan, and diagnose failures from real evidence.
---

# Waitcher

You operate the waitcher CLI for the user. The repository is the source of truth: `waitcher.json` declares the monitors of one project per environment, test files hold the scripts, and `waitcher deploy` reconciles one environment at a time. Commands print JSON on stdout (`run diagnose` and `run scenarios` need `--json` for it); failures print `{error:{code,message}}` on stderr, some with `next`. Read the exit code, every `issues` entry and every `next` step.

People usually start you with: "Use the waitcher skill to set up monitoring for this repository: pick the critical journeys, try them locally, and deploy them paused through a reviewed plan."

This skill says what to do and in which order. For exact syntax use the installed CLI, never memory: `waitcher help TOPIC` (for example `help deploy`, `help secret`, `help run`) prints only that part of the help for this CLI version, and `waitcher explain CODE` explains an issue or error code. The user guide at https://waitcher.dev/docs/ explains the same product for people; link the user to a page (CLI install and updates, alerts, access tokens, account) instead of retelling it.

## Rules

- Never put secrets in files, arguments or output. Pipe values to `--value-stdin`.
- Keep new monitors paused. Pass `--activate-new`, `--prune`, `--adopt` or `--smoke` only when the user agreed to that effect.
- Show the user the plan's `changes` before `deploy apply`, and apply with `--based-on` from that plan.
- A local pass is not hosted permission. If capabilities or limits refuse something, report it; never switch accounts or workspaces, raise limits or remove assertions to get a green result.
- Work in the workspace the user chose. `waitcher auth status` names the active one (personal or a team) and your role; ask before `workspace use`, `--workspace` or any `member` command.
- An agent's own success claim is not evidence. Verify outcomes through the product's state or real run evidence.
- Do not turn a whole regression suite into monitors. Pick two to five journeys whose failure the user would act on.

## Workflow

1. **Check the setup.** Run `waitcher doctor` in the repository. Fix `error` checks first; its `next` lists exact commands. Each `next` entry is either one command to run as is or a sentence with commands in backticks. In a new repository doctor only warns (no `waitcher.json`, not signed in) and its `next` names both paths: a local try with `monitor init` and `run local`, or `config init` with the production HTTPS URL; pick by what the user wants, and never pass a localhost URL to `config init`. Local runs need no account. For anything hosted, including `monitor apply --dry-run` and `deploy plan`, ask the user to run `waitcher auth login` themselves (it opens their browser; a first sign-in creates a free Starter account; over SSH or in a container they use an automation token); every `AUTH_REQUIRED` error says so in `next`. `CONFIG_DIR_PERMISSIONS` means the session folder is readable by others: show the user the command in `next`.
2. **Understand the product.** Read the repository: base URLs per environment, existing E2E tests, critical journeys, test accounts and jobs. Ask the user which failures should alert them.
3. **Start the file.** `waitcher config init --project-name NAME --target https://BASE` when there is no `waitcher.json`; the target is the deployed HTTPS site. To try an app that only runs locally first, write one monitor file instead (`waitcher monitor init --type http --file website.monitor.json --target http://localhost:PORT`, then `waitcher run local --file website.monitor.json`; a browser monitor needs `waitcher runtime install --browser` first). Until a deploy, no `waitcher.json` is needed and doctor only warns about it. An environment whose `baseUrl` is a local address is for `config validate --env NAME --verify` only; doctor and validate never suggest deploying it. Give each monitor a stable lowercase `key`; changing a key later replaces the monitor and its history.
4. **Choose types.** `http` for status and content, `certificate` for TLS expiry, `tcp` for a database, mail or SSH port, `dns` for records that must keep their values, `heartbeat` for jobs that report in, `api` for a multi-request invariant, `browser` for a user journey, `mcp` when the product ships a remote MCP server. `waitcher monitor init --type TYPE --file x.json` prints a complete example of any type. Script monitors name their test with `entry`; read [authoring](references/authoring.md) before writing one. They need the pinned runtime next to `waitcher.json`: run `waitcher runtime install`, show the user the steps it lists (npm install runs package install scripts; browser projects download Chromium), and after they agree rerun it with `--yes`. It writes exact pins into `package.json`, updates `.gitignore` and is safe to repeat: a rerun finishes an install that stopped halfway. On the free Starter plan, API, browser and visual monitors run at most every 2 hours (`"interval": 7200`); validate lists shorter ones in `notes`, and a deploy on Starter refuses them.
5. **Validate offline.** `waitcher config validate` resolves every environment and builds every entry. Fix each issue at its `path`. Add `--env NAME --verify` (optionally `--key KEY`) to run the api/browser entries locally without an account; read the run directory it names when one fails.
6. **Plan.** `waitcher deploy plan --env NAME --verify` runs script monitors locally against that environment, then asks the server. Resolve errors (`SECRET_MISSING`: ask the user for the value and run `waitcher secret set`; `ADOPTION_CANDIDATE`: ask whether the existing monitor is the same check).
7. **Apply.** After the user accepts the plan: `waitcher deploy apply --env NAME --based-on BASED_ON`, where BASED_ON is the plan's `basedOn` or `none` when it is null (first deploy); the plan's `next` prints the exact command. Add `--smoke` for one hosted run per changed monitor. New monitors stay paused.
8. **Report.** Give the user the monitor IDs, what each checks, local and hosted results, evidence paths and anything still pending (paused schedules, heartbeat credentials, secrets for other environments). If `waitcher alert policy list` shows no routing, failures will alert nobody: point the user to https://waitcher.dev/docs/alerts.

## Runtime upgrades

Checks run on the runtime generation the project pins; nothing moves them but a deploy. When the user asks to upgrade Waitcher or its runtime, doctor names a newer generation, or you see `RUNTIME_VERSION_ENDING` or `RUNTIME_VERSION_MISMATCH`: run `waitcher runtime upgrade` in the repository and repeat it until `stage` is `current` (`--to ID` targets another supported generation). Each call reports one stage with its `steps`; do them in order. In the `upgrade` stage, `changes[]` names what changed, the lines of this project it may affect (`matches`) and a `fix`, and `previews[]` shows how each hosted check did when Waitcher ran it on the target. Before `--yes` (it installs packages and Chromium) show the user `install.steps` and wait for agreement. Then fix the scripts, run `config validate --env NAME --verify`, show the diff for a commit, and in the `deploy` stage plan and apply each environment it lists. Checks made in the web app (no `waitcher.json`) move with `waitcher runtime move --id MONITOR_ID` once their preview passed. After a generation ends its checks that did not pass their preview are paused (`RUNTIME_ENDED`, `hosted[].paused` in the upgrade output) until the project upgrades and deploys. Never upgrade unasked: a supported generation is the user's choice.

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
- [optional capabilities](references/optional-capabilities.md): visual baselines, browser identities, verified HTTP credentials, invocation budgets, agent checks, public status pages, team workspaces.
- [AI and agents](references/ai-and-agents.md): agent outcome checks, scenario evidence, AI endpoints and suites, calibration, AI steps in scripts, protected requests.
- Read the last two only when `waitcher system capabilities` reports the feature and the user needs it.
