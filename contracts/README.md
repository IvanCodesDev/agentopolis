# ProofOfQuestRegistry

Minimal on-chain contribution credentials for the Proof of Quest demo. This is
a registry, not an NFT: credentials cannot be transferred or traded.

## Behavior

- Any wallet may issue a credential to a non-zero designer address.
- Each credential records its issuer, designer, anonymous project hash,
  evidence hash, public category, role, summary, issue time and revocation time.
- Credentials are indexed by designer address.
- Only the original issuer may revoke a credential.
- Revocation preserves the credential and its history.
- No payments, tokens, ownership transfers or private files are handled.

Never include a client name, price, contact details, contract, unpublished
design, or other confidential data in the public strings. Hash the anonymous
project reference with a high-entropy salt before calling the contract.

## Local development

```bash
cd contracts
npm install
npm test
```

## Monad Testnet deployment

The configured test network is Monad Testnet (`chainId` 10143). Fund a dedicated
test wallet with test MON, then export environment variables without committing
them:

```bash
export MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
export DEPLOYER_PRIVATE_KEY=0x...
npm run deploy:monad-testnet
```

Verify the deployed address on `https://testnet.monadscan.com`. Do not copy a
mainnet address into the testnet configuration.

Monad charges based on the transaction gas limit. Frontends should estimate each
contract call and add at most a small buffer rather than setting a large generic
limit.
