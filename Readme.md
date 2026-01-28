# Ninah - Privacy-Preserving Payments

<div align="center">

**Send and receive IDRX stablecoin payments without exposing your wallet address**

</div>

---

## Live Demo & Contracts

| Resource | Link |
|----------|------|
| **Application** | [https://ninah.vercel.app](https://ninah.vercel.app) |
| **Network** | Base Sepolia Testnet |
| **Block Explorer** | [BaseScan Sepolia](https://sepolia.basescan.org) |

### Deployed Contracts

| Contract | Address |
|----------|---------|
| NinjaRupiah (Main) | [`0xC04C8390C8a53B686c569d663f215f93cBA82e73`](https://sepolia.basescan.org/address/0xC04C8390C8a53B686c569d663f215f93cBA82e73) |
| MockIDRX (Stablecoin) | [`0x11a033aC69a658eEe232439e80A5f4D1038e144d`](https://sepolia.basescan.org/address/0x11a033aC69a658eEe232439e80A5f4D1038e144d) |
| MockSP1Verifier | [`0x100DbE7A6A5B967A2d55b2b972bd31f89cE723ff`](https://sepolia.basescan.org/address/0x100DbE7A6A5B967A2d55b2b972bd31f89cE723ff) |

---

## What is Ninah?

Ninah (NinjaRupiah) is a privacy-preserving payment protocol built on Base. Users send and receive Indonesian Rupiah stablecoin (IDRX) without revealing wallet addresses on-chain.

Instead of sharing a public wallet address, users share a **username**. Payments go to one-time **stealth addresses** that only the recipient can access.

---

## The Problem

### Blockchain Payment Transparency

When sharing a wallet address to receive payments:

```
Wallet: 0xABC123...

Publicly visible:
├── Total balance
├── All transactions
├── Counterparty addresses
├── Complete transaction history
└── All token holdings
```

### Practical Implications

- **Salary Payments**: Employer sees complete financial history
- **Freelance Work**: Clients see other clients and payment rates
- **Personal Payments**: Contacts see spending patterns
- **Business Transactions**: Competitors analyze cash flow
- **Security**: High balances increase attack surface

---

## Solution

### Stealth Addresses + Username System

Ninah implements **ERC-5564 stealth addresses** with a username system:

```
Standard Payment:
  Sender ──► Public Wallet ──► Visible on-chain

Ninah Payment:
  Sender ──► @username ──► One-Time Stealth Address ──► Recipient only
```

### Payment Flow

1. **Register**: Create username and generate meta keys
2. **Share**: Provide "@username" instead of wallet address
3. **Receive**: Each payment creates a unique stealth address
4. **Claim**: Only recipient can detect and claim payments

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Alice pays Bob                                                 │
│                                                                  │
│   1. Alice looks up "@bob" ──► Gets Bob's public meta keys       │
│                                                                  │
│   2. Alice generates one-time stealth address                    │
│      (Derived from Bob's keys + ephemeral random data)           │
│                                                                  │
│   3. Alice sends IDRX to stealth address                         │
│      (On-chain: funds sent to 0xSTEALTH...)                      │
│                                                                  │
│   4. Bob scans blockchain, detects payment                       │
│      (Using private viewing key)                                 │
│                                                                  │
│   5. Bob claims funds with derived private key                   │
│      (Only Bob can compute this key)                             │
│                                                                  │
│   Observer sees: "Funds sent to 0xSTEALTH..."                    │
│   Observer cannot link: 0xSTEALTH ──► Bob's identity             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Innovations & Technology

### 1. ERC-5564 Stealth Addresses

| Component | Purpose |
|-----------|---------|
| **Meta Viewing Key** | Detect incoming payments (view-only) |
| **Meta Spending Key** | Derive private keys to claim funds |
| **Ephemeral Keys** | One-time keys per payment |
| **ECDH Shared Secret** | Cryptographic link between sender and recipient |

### 2. Cryptographic Primitives

```
┌──────────────────────────────────────────────────────────────┐
│  Curve:     secp256k1 (Ethereum/Bitcoin standard)            │
│  Hashing:   Keccak-256                                       │
│  ECDH:      Elliptic Curve Diffie-Hellman                    │
│  Library:   @noble/curves (audited, pure JavaScript)         │
└──────────────────────────────────────────────────────────────┘

Stealth Address Derivation:
  stealthPub = recipientSpendingPub + hash(sharedSecret) × G
  stealthAddr = keccak256(stealthPub)[12:32]

Private Key Derivation (recipient only):
  stealthPriv = recipientSpendingPriv + hash(sharedSecret) mod n
```

### 3. Browser Key Management & Encryption

All private keys are derived and stored client-side using browser cryptography:

#### Key Derivation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     KEY DERIVATION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Password Hash (Argon2id)                                     │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  Password + Salt ──► Argon2id ──► Password Hash (32B)   │ │
│     │                                                          │ │
│     │  Config: 64MB memory, 3 iterations, 4 threads            │ │
│     │  Resistant to GPU/ASIC attacks                           │ │
│     └─────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  2. Wallet Signature (Privy)                                     │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  Wallet signs deterministic message ──► Signature (65B) │ │
│     │  Tied to wallet address, cannot be forged               │ │
│     └─────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  3. Master Key (HKDF-Keccak256)                                  │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  Password Hash + Wallet Signature                        │ │
│     │           │                                              │ │
│     │           ▼                                              │ │
│     │  HKDF-Keccak256 ──► Master Key (32 bytes)               │ │
│     │                                                          │ │
│     │  Combines: something you know + something you have       │ │
│     └─────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  4. Sub-Key Derivation (HKDF with domain separation)             │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  Master Key                                              │ │
│     │      │                                                   │ │
│     │      ├──► Storage Encryption Key (32B)                   │ │
│     │      ├──► Meta Viewing Private Key (32B)                 │ │
│     │      └──► Meta Spending Private Key (32B)                │ │
│     └─────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Browser Storage Encryption

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL STORAGE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Algorithm: AES-256-GCM (Authenticated Encryption)               │
│  Nonce:     12 bytes (96 bits), randomly generated               │
│  Tag:       16 bytes (128 bits), authentication                  │
│  Key:       32 bytes (256 bits), from HKDF                       │
│                                                                  │
│  Encrypted Format:                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Version (1B) │ Nonce (12B) │ Tag (16B) │ Ciphertext (194B)  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Storage: IndexedDB (encrypted keys)                             │
│                                                                  │
│  Security Properties:                                            │
│  ├── Confidentiality: AES-256 encryption                         │
│  ├── Integrity: GCM authentication tag                           │
│  ├── Freshness: Random nonce per encryption                      │
│  └── Tamper detection: Tag verification fails on modification    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Storage Binary Format

```
Offset │ Length │ Field
───────┼────────┼──────────────────────
0      │ 32     │ masterKey
32     │ 32     │ storageEncryptionKey
64     │ 32     │ metaViewingPriv
96     │ 33     │ metaViewingPub (compressed)
129    │ 32     │ metaSpendingPriv
161    │ 33     │ metaSpendingPub (compressed)
───────┼────────┼──────────────────────
Total: 194 bytes
```

### 4. Username Privacy

Usernames stored as hashed values on-chain:

```solidity
// On-chain storage
mapping(bytes32 => address) public usernameHashToAddress;

// Registration
bytes32 usernameHash = keccak256("alice");
usernameHashToAddress[usernameHash] = msg.sender;
```

- Plain-text username never appears on-chain
- Sender must know username to compute hash
- Prevents enumeration of registered usernames

### 5. ZK Proof System (Production)

Production version uses **SP1 zkVM** for zero-knowledge proofs:

| Proof Type | Purpose |
|------------|---------|
| Username Registration | Prove knowledge of secret creating commitment |
| Stealth Claim | Prove ownership without revealing keys |

> **Note**: This repository uses a mock verifier for development.

### 6. Smart Account Integration

Built with **Privy** embedded wallets and **Coinbase Smart Wallet**:

- Gasless transactions via paymasters
- Social login (email, Twitter, Farcaster)
- No seed phrase required
- ERC-4337 account abstraction

---

## Architecture

```
ninah/
├── contracts/                    # Solidity smart contracts
│   ├── src/
│   │   ├── NinjaRupiah.sol      # Main protocol contract
│   │   ├── MockSP1Verifier.sol  # Mock ZK verifier (dev only)
│   │   └── MockIDRX.sol         # Mock IDRX stablecoin
│   └── test/
│       └── NinjaRupiah.t.sol    # Foundry tests
│
├── frontend/                     # Next.js application
│   ├── src/
│   │   ├── app/                 # App router pages
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/
│   │       ├── stealth/         # Stealth address cryptography
│   │       ├── crypto/          # ECDH, KDF, encryption
│   │       ├── contracts/       # Contract interactions
│   │       └── keys/            # Key management & storage
│   └── public/
│
└── docs/                         # Documentation
    └── stealth-payment-flow.md  # Protocol specification
```

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/) v1.0+
- [Foundry](https://getfoundry.sh/) for smart contracts
- [Git](https://git-scm.com/)

### Quick Start

```bash
# Clone repository
git clone https://github.com/anthropics/ninah.git
cd ninah

# Install frontend dependencies
cd frontend
bun install  # or npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
bun run dev  # or npm run dev
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_URL=http://localhost:3000

# Optional: Custom RPC (defaults to sepolia.base.org)
# NEXT_PUBLIC_RPC_URL=https://your-rpc-url
```

### Smart Contract Development

```bash
cd contracts

# Install dependencies
forge install

# Run tests
forge test -vvv

# Deploy to local Anvil
anvil &
forge script script/DeployMock.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Base Sepolia
forge script script/DeployMock.s.sol \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### After Deployment

Update contract addresses in:
- `frontend/src/lib/contracts/addresses.ts`

---

## Mock vs Production

This repository contains the **mock version** for development:

| Feature | Mock (This Repo) | Production |
|---------|------------------|------------|
| ZK Proofs | Always pass | Verified by SP1 zkVM |
| Verifier | `MockSP1Verifier` | Real SP1 Verifier |
| Proof Generation | Local, instant | Backend prover network |
| Security | Development only | Production ready |

### Verifier Comparison

```solidity
// MockSP1Verifier.sol - Always returns true
function verifyProof(bytes32, bytes calldata, bytes calldata) external view returns (bool) {
    return !shouldRevert;
}

// Production SP1Verifier - Cryptographic verification
function verifyProof(bytes32 vkey, bytes calldata publicValues, bytes calldata proof) external view returns (bool) {
    return SP1.verify(vkey, publicValues, proof);
}
```

---

## Security Considerations

### Privacy Guarantees

| Property | Status | Notes |
|----------|--------|-------|
| Payment Unlinkability | Implemented | Each payment uses unique stealth address |
| Recipient Privacy | Implemented | Observer cannot identify recipient |
| Sender Privacy | Partial | Sender address visible (relayer needed for full privacy) |
| Amount Privacy | Not implemented | Transaction amounts are public |

### Current Limitations

1. **Claiming Privacy**: Current implementation exposes claimer's wallet when claiming
2. **Sender Visibility**: Sender's address visible on-chain
3. **Mock Proofs**: This version uses mock ZK verification (not secure for production)

### Production Requirements

- Deploy real SP1 Verifier
- Implement relayer for private claiming (EIP-2612 permit)
- Add mixnet or privacy pool for sender privacy
- Audit cryptographic implementations

---

## Code Style

- **Solidity**: OpenZeppelin patterns, custom errors
- **TypeScript**: Use viem (not ethers.js), strict mode
- **Naming**: `Mock` prefix for mock implementations

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built for Base Batched Hackathon**

</div>
