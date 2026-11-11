# Repository deploys

Read when the user keeps monitors in a repository with `waitcher.json`. The core workflow is in SKILL.md; this file holds the details. `waitcher doctor` confirms that the server supports deploys.

## The file

```json
{
  "schemaVersion": 1,
  "project": "Shop",
  "environments": {
    "production": { "baseUrl": "https://shop.example" },
    "staging": { "baseUrl": "https://staging.shop.example" }
  },
  "defaults": { "interval": 1800, "timeout": 15 },
  "monitors": [
    { "key": "home", "type": "http", "path": "/", "settings": { "contains": "Shop" } },
    { "key": "tls", "type": "certificate" },
    { "key": "checkout", "type": "browser", "entry": "monitoring/checkout.e2e.ts", "timeout": 45 },
    { "key": "orders-api", "type": "api", "entry": "monitoring/orders.e2e.ts",
      "settings": { "envNames": ["CHECK_ORDERS_TOKEN"] } },
    { "key": "nightly-export", "type": "heartbeat", "environments": ["production"],
      "heartbeat": { "graceSeconds": 300, "completionSeconds": 900 } }
  ]
}
```

- `config init` starts with two example monitors (`home`: HTTP 200 on `/`; `tls`: certificate expiry). Keep, change or remove them.
- Environment names match case-insensitively: `production` in the file is the project's default `Production` environment.
- HTTP `settings`: `method`, `expectedStatus`, `contains`, `jsonPath` with `jsonValue`, `maxLatency` (ms), `headers`, `body`; certificates: `certificateMinDays` (default 14). `waitcher monitor init --type TYPE --file x.json` writes a complete example of any type.
- A 30-minute interval suits HTTP, certificate and browser checks alike; certificates rarely need more often. Personal accounts follow their plan: checks every 30 minutes on starter, 5 on pro and 1 on business at the shortest; script monitors have a count, a shortest interval and runs a day that the running schedules must fit together (starter: one, every 2 hours or slower). Read `limits.minInterval` and `limits.isolatedScripts` in `system capabilities` before planning.
- Entries are ordinary monitor definitions plus `key`, optional `environments` and optional `path` (resolved against `baseUrl`). Script and certificate targets default to `baseUrl`; heartbeats use the key as their label.
- Never set `enabled`, `script`, `scriptFile`, `schemaVersion`, `context` or `demo` in entries.
- Script tests read `process.env.TARGET_URL` (API) or call `app.open("/")` (browser), so one test serves every environment.
- The directory holding `waitcher.json` must have `e2e@0.21.1`, `@e2e-dev/web@0.15.1` (browser) and `esbuild@0.28.2` installed exactly; `waitcher runtime install` sets them up and later upgrades them (ask before `--yes`). Do not let dependency bots move these three packages. Tests may import project files and JSON; other packages fail with `BUILD_FAILED` naming the import. Replace them with project code, `fetch` or JSON data; do not vendor a dependency to get past the limit. A built script must fit 50,000 characters.

## Plan and apply

- `config validate --env NAME --verify [--key KEY]` runs that environment's script entries locally without an account. `deploy plan --env NAME [--verify]` changes nothing. `changes` lists `create`, `adopt`, `update` (with `fields`), `unchanged`, `delete`, `orphaned` and `invalid` per key.
- `deploy apply --env NAME --based-on BASED_ON` applies the whole environment or nothing. `ok:false` exits 2 and writes nothing. A stale `--based-on` is `CONFLICT`: plan again and show the new plan.
- The repository owns definitions; the server owns pause and resume. Managed monitors refuse edits through `monitor apply` or the web (`MANAGED_BY_CONFIG`); change the file instead.
- Undeclared monitors stay as `orphaned` warnings. `--prune` deletes them and their history; use it only with the user's consent.
- Deploy versions come from the Git commit (`-dirty` when `waitcher.json` has uncommitted changes). A configuration deploy is not a product release: runs show `context.deployment` only for markers recorded with `waitcher deployment record`.
- `--smoke` runs each created, adopted or updated monitor once on the server after apply. A failed smoke leaves the deploy applied and exits 4; follow `next` to `run diagnose`. On a personal account only the first monitor's smoke starts (one manual run per 10 minutes); the rest are `skipped`, which is not a failure.

## Secrets

Scripts list `CHECK_*` names in `settings.envNames`. Values live per project environment on the server:

```sh
printf %s "$VALUE" | waitcher secret set --env staging --name CHECK_ORDERS_TOKEN --value-stdin
waitcher secret list --env staging
```

Ask the user for each value, or tell them the command to run themselves. Never echo, log or commit it. A plan reports `SECRET_MISSING` with the missing names. `--verify` runs with your local environment, so export the same `CHECK_*` variables locally (never in files) or skip `--verify` for that monitor and rely on `--smoke`.

Listed values of at least 6 characters appear as `<secret:CHECK_NAME>` in reports, traces and logs; screenshots, video and transformed values are not masked. For a password or token typed into a page, prefer `fill(secrets.get("CHECK_NAME"))` (`import { secrets } from "e2e"`) over `process.env`: the value stays out of the test code and the run refuses `app.screenshot()` after that fill, so take screenshots before it or drop them. Read `process.env.CHECK_NAME` for values the script sends itself, such as API headers. Never log a value or assert on it.

## Adopting existing monitors

When a plan warns `ADOPTION_CANDIDATE`, an existing unmanaged monitor looks like the entry. Show it to the user (`waitcher monitor get --id ID`). If it is the same check, plan and apply with `--adopt KEY=MONITOR_ID`: it keeps its ID, history and pause state and takes the file's definition. Otherwise ignore the warning; apply creates a separate monitor.

## Rollback

`waitcher deploy list --project-id ID` shows deploys; `restorable:true` marks the latest 10 per environment. `waitcher deploy rollback --id DEPLOY_ID --dry-run` shows the plan, then run it with `--based-on`. Secrets are not rolled back. Tell the user to revert the repository too, or the next apply reintroduces the change.

## CI

`waitcher ci init [--env production] [--file waitcher.json]` writes `.github/workflows/waitcher.yml`: plan on pull requests, apply on pushes to the main branch. It installs the CLI from the server with a checksum and signs in with the `WAITCHER_TOKEN` repository secret. Create that token with read and write permissions (add run for `--smoke`) and `"projectId"` set to the project's ID (from `deploy plan`'s `project.id`) using `waitcher token create`, so CI cannot touch other projects, and let the user store it with `gh secret set WAITCHER_TOKEN`. Set the `WAITCHER_SERVER` repository variable for a non-default server.
