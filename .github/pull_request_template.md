## What does this change?

<!-- One or two sentences. If it fixes an issue, add "Fixes #123". -->

## Why?

<!-- What problem does this solve? If there's an issue discussing it, link it.
     For anything non-trivial, please open an issue first — see CONTRIBUTING.md. -->

## How did you verify it?

<!-- Tests you added, manual steps you took, browsers you checked.
     "It builds" is not verification. -->

## Checklist

- [ ] `npm run check --workspaces` is clean (zero errors)
- [ ] `npm test --workspaces` passes
- [ ] Logic changes in `packages/core/` have test coverage
- [ ] Commits are signed off (`git commit -s`) — see [CONTRIBUTING.md](../CONTRIBUTING.md)

<!-- If your change touches any of the following, please say so explicitly —
     these get closer review:
       - packages/core/src/ssrf.ts, url.ts, fetch-utils.ts
       - ldns2/src/lib/server/
       - either extension manifest (permissions!)
       - anything that adds a network request or a new third-party service -->
