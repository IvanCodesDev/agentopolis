# Proof of Quest

An interactive pixel-art story about a freelance designer turning invisible
outsourcing work into a verifiable professional contribution credential on
Monad.

## Demo

```bash
npm install
npm run dev
```

Move with WASD or the arrow keys. Press `E` near a location to interact.

Recommended story order:

1. Learn why the designer's unsigned work cannot be verified
2. Let the studio create an anonymous task and invite the designer
3. Accept the task and submit V1 at the workbench
4. Switch to the studio, reject V1 with concrete feedback
5. Submit V2 and let the studio approve it
6. Issue the contribution credential on the Monad adapter
7. Add it to the designer's career archive
8. Switch to the HR visitor and verify it without a wallet
9. Optionally demonstrate revocation at the Monad memory monument

The current demo uses a local credential adapter so the complete story remains
playable without testnet funds. The Monad contract adapter is the next step.

The full narrative and privacy boundaries are documented in
[`docs/story-v2.md`](docs/story-v2.md).
