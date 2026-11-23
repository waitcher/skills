# Authoring and running monitors

Read when writing or changing a test, choosing a monitor type, or running it locally. For exact syntax run `waitcher help monitor` or `waitcher help run`. AI endpoints, agent outcome checks and model steps are in [ai-and-agents](ai-and-agents.md).

## Choose the type

- `http`: status, body text, a JSON value or latency of one request. No script.
- `certificate`: TLS expiry and chain. No script.
- `heartbeat`: a job reports start and success; Waitcher alerts when it does not.
- `tcp`: a public `HOST:PORT` accepts connections (database, mail, SSH); optional `tcp.banner` the server must send first. No script.
- `dns`: a name's `A`, `AAAA`, `CNAME`, `MX` or `TXT` records hold `dns.expected` (`match`: `includes` or `exact`), asked of public resolvers. In `waitcher.json` a `dns` entry without `target` checks the `baseUrl` host. Details: https://waitcher.dev/docs/network.md.
- `mcp`: a remote MCP server (Streamable HTTP). Lists tools and checks `mcp.expectTools`; an optional `mcp.toolCall` calls one side-effect-free tool with fixed arguments and JSON-pointer `assertions` on its result. No script. `run local --file mcp.json` runs it without an account; its `mcp-report.json` lists the tool names and `mcp-tool-result.json` holds the called tool's answer, so read both before writing `expectTools` and assertions. Personal tool calls need verified `httpAuth` and a 30-minute interval; listing tools needs neither. Never pick a tool that writes data. Details: https://waitcher.dev/docs/mcp.md.
- `api`: a script with several requests and an invariant between them.
- `browser`: a script that walks a user journey in Chromium.
- `visual`: a screenshot of one public page or element compared with a baseline the user approved. No script; see [optional capabilities](optional-capabilities.md#optional-visual-checks).

`waitcher monitor init --type TYPE --file x.json` writes a paused example of every type; `api` and `browser` also write `x.e2e.ts`. Keep scripts focused on the requested behavior and use controlled test identities for actions that change state.

## Scripts in waitcher.json

In a repository, a script monitor is an entry with `entry` pointing at its test file; one test serves every environment because it reads the base URL at run time.

```json
{ "key": "checkout", "type": "browser", "entry": "monitoring/checkout.e2e.ts", "timeout": 45 }
```

Run the entries of one environment locally, without an account:

```sh
waitcher config validate --env production --verify
waitcher config validate --env production --verify --key checkout
```

Exit 4 with `VERIFY_FAILED` names the failing assertion and the run directory to read. `run local --file` takes a single monitor manifest, not `waitcher.json`.

## Browser journey

```ts
import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("visitor can start a game", async ({ app, browser, screen }) => {
  await app.open("/games/klondike/");
  await expect(browser.locator("main h1")).toContainText("Solitaire");
  await expect(screen.getByRole("button", "New game")).toBeVisible();
  await app.screenshot("game");
});
```

- `app.open(path)` resolves against the environment's base URL. Browser base URLs have no query or fragment; navigate to those URLs inside the script.
- Find elements the way a visitor does with the `screen` fixture: `screen.getByRole("button", "New game")`, `screen.getByLabel("Email")`, `screen.getByText("Welcome")`, `screen.getByPlaceholder(...)`, `screen.getByTestId(...)`. Prefer these over CSS selectors.
- The `browser` fixture navigates and offers CSS `browser.locator("main h1")` plus `expect(browser).toHaveURL(...)`; it has no `getBy*` methods.
- Assertions come from `e2e`: `toBeVisible()`, `toContainText(...)`, `toHaveText(...)`.

## API script

```ts
import { test, expect } from "e2e";

test("orders API keeps totals consistent", async () => {
  const target = new URL(process.env.TARGET_URL!);
  const response = await fetch(new URL("/api/orders?limit=1", target));
  expect(response.status).toBe(200);
});
```

API scripts import `test, expect` from `e2e` and read `process.env.TARGET_URL`. Secrets reach them only as `CHECK_*` names listed in `settings.envNames` (see [deploy](deploy.md)). The test runs as trusted local code, not in a sandbox.

## Standalone manifest

Without `waitcher.json`, a monitor is one JSON file. `monitor init --type browser --file monitor.json` writes it with `scriptFile` next to the test:

```json
{
  "schemaVersion": 1,
  "name": "Product / key journey",
  "type": "browser",
  "target": "https://example.com/",
  "enabled": false,
  "interval": 1800,
  "timeout": 30,
  "scriptFile": "journey.e2e.ts"
}
```

`scriptFile` resolves relative to the manifest; `monitor validate --file monitor.json` checks the actual contract. The platform receives one script per monitor, not the project directory. When the test imports shared helpers, run `monitor build --file monitors/checkout.json --project . --output build/checkout`: it needs installed `esbuild`, bundles code and JSON helpers, keeps only supported framework and Node imports, and writes `monitor.js`, `monitor.json` and `build.json` into a new directory. Unsupported dependencies and module-relative file access fail the build. Verify and apply the built `monitor.json`. The script limit is 50,000 characters and hosted dependencies are fixed.

## Run locally and inspect evidence

The runtime project needs `e2e` and, for browser tests, `@e2e-dev/web` and Chromium, at the exact versions `waitcher runtime install` prints. Run `waitcher runtime install [--browser]` in the folder that holds `package.json` (or pass `--file DIR/waitcher.json`; the file need not exist, and a monitor file is refused): it lists the npm install and Chromium download; rerun it with `--yes` once the user agrees. A project that already has `@e2e-dev/web` or a browser monitor file keeps the browser packages without `--browser`. Without `waitcher.json` its `next` is the `run local` command of each monitor file it finds. Chromium goes to the Playwright browser cache (`PLAYWRIGHT_BROWSERS_PATH` when set), not the runtime directory; a browser run without it downloads it first and says so in `notes`.

```sh
waitcher run local --file monitor.json          # runtime: the current folder
waitcher run local --file monitor.json --runtime /path/to/runtime --video
waitcher run local --project /path/to/e2e-project --timeout 60
```

- `--project` runs an existing E2E project with its own config and imports; its `--output` must stay inside that project.
- Runs are serial, never retried or replayed, and get a fresh directory under `.waitcher/runs/` (`--output DIR` chooses the parent). Traces are always requested; video is opt-in, and tests can override recording, so inspect the returned files.
- A run that did not pass prints `code`, `message`, `test`, `trace` and `next` at the top level; do what `next` says ([diagnosis](diagnosis.md#local-runs)). Then read the `trace` file and `.e2e/summary.md`, then `execution.log` and `report.json`, or `waitcher run diagnose --directory RUN_DIR`. The `waitcher-*.mjs` files there are runtime support, not your test. Traces are Markdown, not Playwright ZIPs; there is no HAR option, and app logs hold selected console and request failures only.
- `APP_UNREACHABLE`, or an HTTP check's `fetch failed: connect ECONNREFUSED 127.0.0.1:3000`, means nothing answered at the target: start the app (or fix the URL) before changing the monitor.
- Exit codes: 0 passed, 4 failed or error, 130 interrupted. After an interruption, inspect partial evidence before repeating a possibly completed action.
- Fix test mistakes while preserving the user's assertions; never weaken an assertion just to get green.
- Evidence can contain private content: keep `.waitcher/`, `.e2e/`, keys and reports out of Git. The default `.waitcher/` folder carries its own `.gitignore`. Local results are not uploaded and are not hosted health evidence.

## Apply one monitor through the API

When hosted scripts are allowed and applying configuration is in scope:

```sh
waitcher monitor apply --file monitor.json --dry-run
waitcher monitor apply --file monitor.json
waitcher monitor get --id MONITOR_ID
```

Keep the monitor paused unless the user requested scheduled execution; applying does not run it. For an authorized single hosted run use `run start --id MONITOR_ID --wait`, then `run status`, `run trace --id RUN_ID` (steps, failed assertion, screenshots, fetch calls) and `artifact get` for evidence. Hosted scripts run under the server's execution policy and can differ from a local run.

Edits are complete replacements: `monitor export`, change the file, then `monitor apply --file FILE --id ID --expected-revision N` with the revision from get or export. Use a stable `--request-key` to recover one uncertain create or run; never change the payload under that key or repeat a possibly executed action. Report the exact monitor and run IDs, local evidence path, observed outcome and any difference between local and hosted results.
