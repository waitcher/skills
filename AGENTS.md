# Maintaining the public Waitcher skill and examples

This repository distributes skill instructions, metadata and example monitor configuration. Keep service and CLI source, credentials, tokens, project and monitor identifiers, run evidence and screenshots out of it.

The skill in `skills/waitcher` is a copy of the one the `@waitcher/cli` npm package carries. Do not edit it here: change it in the product repository, publish the CLI, then copy the directory over and compare it with `waitcher skill show`. Publish a GitHub Release at the matching `vX.Y.Z` tag when the skill changes in a way an agent would notice, and name the minimum CLI version. Do not move existing tags.

The examples are the monitors that run in production against the owner's own sites. Change one only together with the deployed monitor, and run `waitcher config validate` in its folder before committing. Do not add examples that point at sites the owner does not run.

Keep `examples/ci` outside `.github/workflows` so the sample workflow never runs here. Do not use long dashes in prose.
