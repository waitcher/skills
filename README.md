# Waitcher agent skill and examples

[Waitcher](https://waitcher.dev) checks that a site works and looks right: HTTP and certificate checks, API and browser tests, and visual checks, declared in a `waitcher.json` in your repository and deployed with the [Waitcher CLI](https://www.npmjs.com/package/@waitcher/cli).

This repository has two things:

- **The agent skill** ([skills/waitcher](skills/waitcher/SKILL.md)). It teaches Claude Code, Codex, Cursor and other agents that read `SKILL.md` to set up monitoring for a repository: pick the critical journeys, verify them locally, deploy them paused through a reviewed plan and diagnose failures from real evidence.
- **Working examples** ([examples](examples)). The monitors that watch five real sites in production, as they are deployed.

## Install the skill

```sh
npx skills add OWNER/REPO
```

Or install the CLI and the copy of the skill it carries:

```sh
npm install -g @waitcher/cli@latest
waitcher skill install             # .claude/skills/waitcher in this repository
waitcher skill install --global    # ~/.claude/skills/waitcher
waitcher skill install --path .agents/skills    # Codex and other agents
```

Then ask your agent: "Use the waitcher skill to set up monitoring for this repository." It starts with `waitcher doctor`, which checks the setup and prints the next commands. Signing in is `waitcher auth login`; a free account is enough for the examples below.

## Examples

Each folder is one Waitcher project: a `waitcher.json`, and tests where a monitor runs one.

| Folder | Site | What it shows |
| --- | --- | --- |
| [examples/awesome-testing](examples/awesome-testing/waitcher.json) | awesome-testing.com | The smallest useful set: the page answers, the certificate is valid, the home page looks as approved |
| [examples/vividqr](examples/vividqr/waitcher.json) | vividqr.app | The same three checks on another site |
| [examples/gosiaradzyminska](examples/gosiaradzyminska/waitcher.json) | gosiaradzyminska.pl | The same three checks on another site |
| [examples/leafarcade](examples/leafarcade/waitcher.json) | leafarcade.com | A browser test of one journey: a visitor opens a game ([klondike.e2e.ts](examples/leafarcade/tests/klondike.e2e.ts)) |
| [examples/waitcher](examples/waitcher/waitcher.json) | waitcher.dev | A content check of an API health endpoint and a browser test of the landing page ([landing.e2e.ts](examples/waitcher/tests/landing.e2e.ts)) |

The monitor types used:

```jsonc
{ "key": "home", "type": "http", "path": "/", "settings": { "method": "HEAD", "expectedStatus": 200 } }
{ "key": "tls", "type": "certificate" }
{ "key": "klondike", "type": "browser", "entry": "tests/klondike.e2e.ts", "timeout": 30 }
{ "key": "home-look", "type": "visual", "path": "/" }
```

### Try one against your own site

```sh
cp -R examples/awesome-testing my-site && cd my-site
# edit waitcher.json: the project name and baseUrl
waitcher config validate
waitcher deploy plan --env production
waitcher deploy apply --env production --based-on none
```

New monitors stay paused. A visual check needs an approved image before it can compare anything, so capture one, look at it, then start the schedule:

```sh
waitcher run start --id MONITOR_ID --update-baselines --wait
waitcher visual list --monitor-id MONITOR_ID
waitcher visual image --id COMPARISON_ID --role candidate --file ./private/baseline.png
waitcher monitor resume --id MONITOR_ID
```

The folders with a browser test also carry a `package.json` with the pinned test runtime. Install it with `waitcher runtime install`, then run the test locally with `waitcher config validate --env production --verify`.

### Deploy from CI

[examples/ci/waitcher-leafarcade.yml](examples/ci/waitcher-leafarcade.yml) is the workflow `waitcher ci init` writes: it plans on pull requests and applies on the main branch, signed in with an automation token kept as a repository secret. Copy it to `.github/workflows/` in your own repository; it sits outside that directory here so it does not run in this one.

## What is in here and what is not

This repository holds skill instructions, metadata and example configuration. It has no credentials, tokens, account identifiers or run evidence, and the examples need none: they watch public pages. The Waitcher service and CLI source are in a private repository; the npm package is public.

[User guide](https://waitcher.dev/docs/) · [Visual checks](https://waitcher.dev/docs/visual) · [Coding agents](https://waitcher.dev/docs/agents) · [npm package](https://www.npmjs.com/package/@waitcher/cli) · [MIT license](LICENSE)
