# Agentopolis MVP

Agentopolis is a full-screen pixel-world demo for Proof of Quest. It presents
one minimal contribution-credential workflow through three role views:

- Designer: accept a quest and submit a public contribution summary.
- Guild: review the submission, issue a demo credential, or revoke it.
- HR: inspect public credentials and their current validity.

All wallet, Monad Testnet, transaction, and credential data is simulated in
the browser and stored in `localStorage`. The demo does not submit real
transactions or call a live contract.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Production build

```bash
npm run build
npm start
```

## Assets

Pixel assets are reused from Alicization Town. See [ATTRIBUTION.md](ATTRIBUTION.md)
and [LICENSES/Alicization-Town-AGPL-3.0.txt](LICENSES/Alicization-Town-AGPL-3.0.txt).
