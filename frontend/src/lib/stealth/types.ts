/**
 * Stealth payment information
 *
 * Represents a detected stealth payment on the blockchain.
 * Contains all information needed to track and spend a stealth payment.
 *
 * ## Lifecycle:
 * 1. **Announced**: Payment sent to stealth address, ephemeral pubkey published on-chain
 * 2. **Detected**: Recipient scans blockchain and detects payment is for them
 * 3. **Saved**: Payment info stored in IndexedDB for later spending
 * 4. **Claimed**: Recipient derives private key and spends the payment
 *
 * ## Storage:
 * - Stored in IndexedDB under `payments` object store
 * - Key: `stealthAddress` (unique per payment)
 * - Indexed by: `blockNumber`, `timestamp`, `claimed`
 *
 * @example
 * ```typescript
 * const payment: StealthPayment = {
 *   stealthAddress: "0x1234...5678",
 *   amount: 1000000000000000000n, // 1 IDRX
 *   ephemeralPubkey: new Uint8Array([0x02, ...]), // 33 bytes
 *   ephemeralPubkeyHash: "0xabcd...",
 *   sender: "0x9876...4321",
 *   timestamp: Date.now(),
 *   claimed: false,
 *   blockNumber: 12345678,
 *   transactionHash: "0xdef0..."
 * };
 * ```
 */
export interface StealthPayment {
  /** Ethereum address of the stealth payment (20 bytes hex string with 0x prefix) */
  stealthAddress: string;
  /** Amount of tokens sent (in wei, using bigint for precision) */
  amount: bigint;
  /** Ephemeral public key published by sender (33 bytes compressed) */
  ephemeralPubkey: Uint8Array;
  /** Keccak256 hash of ephemeral public key (for efficient lookups) */
  ephemeralPubkeyHash: string;
  /** Ethereum address of the payment sender (0x-prefixed hex string) */
  sender: string;
  /** Unix timestamp (milliseconds) when payment was detected */
  timestamp: number;
  /** Whether the payment has been claimed/spent by the recipient */
  claimed: boolean;
  /** Block number where the payment was announced */
  blockNumber: number;
  /** Transaction hash of the payment announcement */
  transactionHash: string;
}

/**
 * Meta keys for stealth payments
 *
 * Complete set of meta-address keys (both private and public).
 * Used by the recipient to generate, detect, and spend stealth payments.
 *
 * ## Key Hierarchy:
 * ```
 * Master Key (from password + wallet)
 *   ├─ Meta Viewing Private Key (32 bytes)
 *   │   └─ Meta Viewing Public Key (33 bytes) ← Registered on-chain
 *   └─ Meta Spending Private Key (32 bytes)
 *       └─ Meta Spending Public Key (33 bytes) ← Registered on-chain
 * ```
 *
 * ## Key Usage:
 * - **Viewing Keys**: Scan blockchain for incoming payments (view-only)
 * - **Spending Keys**: Derive stealth private keys to spend payments
 *
 * ## Security:
 * - **CRITICAL**: Private keys must NEVER be stored unencrypted
 * - Store in IndexedDB encrypted with storage encryption key
 * - Zero private keys from memory after use
 * - Public keys are safe to share (registered on-chain with username)
 *
 * ## Derivation:
 * Derived from master key using HKDF-Keccak256 with domain separation:
 * - `Kdf.deriveMetaViewingKey(masterKey)` → metaViewingPriv
 * - `Secp256k1.privateKeyToPublicKey(metaViewingPriv)` → metaViewingPub
 * - `Kdf.deriveMetaSpendingKey(masterKey)` → metaSpendingPriv
 * - `Secp256k1.privateKeyToPublicKey(metaSpendingPriv)` → metaSpendingPub
 *
 * @see {PublicMetaKeys} for public-only keys (safe to expose)
 * @see {DerivedKeys} in keys module for full key derivation
 */
export interface MetaKeys {
  /** Meta viewing private key (32 bytes) - Used to scan for incoming payments */
  metaViewingPriv: Uint8Array;
  /** Meta viewing public key (33 bytes compressed) - Shared with senders */
  metaViewingPub: Uint8Array;
  /** Meta spending private key (32 bytes) - Used to derive stealth private keys */
  metaSpendingPriv: Uint8Array;
  /** Meta spending public key (33 bytes compressed) - Registered on-chain with username */
  metaSpendingPub: Uint8Array;
}

/**
 * Public meta keys (for registration and lookups)
 *
 * Public-only version of meta keys - safe to expose and share.
 * Used for on-chain username registration and sender lookups.
 *
 * ## Use Cases:
 * 1. **Registration**: Register username with public meta keys on-chain
 * 2. **Lookup**: Retrieve recipient's public keys by username
 * 3. **Payment Generation**: Senders use these to create stealth addresses
 * 4. **QR Codes**: Encode in QR for receiving payments
 *
 * ## On-Chain Storage:
 * ```solidity
 * mapping(string => PublicMetaKeys) public usernameToMetaKeys;
 * ```
 *
 * ## Privacy:
 * - Safe to expose publicly (no spending capability)
 * - Cannot derive private keys from public keys
 * - Cannot spend funds (requires private keys)
 * - Can only be used to send payments to the recipient
 *
 * @example
 * ```typescript
 * // Register username with meta-address
 * const publicKeys: PublicMetaKeys = {
 *   metaViewingPub: keyManager.getPublicKeys().metaViewingPub,
 *   metaSpendingPub: keyManager.getPublicKeys().metaSpendingPub,
 *   registered: false
 * };
 *
 * await contract.registerUsername("alice", publicKeys);
 * publicKeys.registered = true;
 *
 * // Lookup recipient's public keys
 * const bobKeys = await contract.getMetaAddress("bob");
 * if (bobKeys.registered) {
 *   // Generate stealth payment to Bob
 *   const payment = Address.generateStealthPayment(
 *     bobKeys.metaViewingPub,
 *     bobKeys.metaSpendingPub
 *   );
 * }
 * ```
 */
export interface PublicMetaKeys {
  /** Meta viewing public key (33 bytes compressed) - For payment detection */
  metaViewingPub: Uint8Array;
  /** Meta spending public key (33 bytes compressed) - For stealth address derivation */
  metaSpendingPub: Uint8Array;
  /** Whether this meta-address has been registered on-chain */
  registered: boolean;
}

/**
 * Stealth payment generation result
 *
 * Result of generating a stealth payment for a recipient.
 * Contains everything the sender needs to send a private payment.
 *
 * ## Sender Workflow:
 * 1. Lookup recipient's public meta keys by username
 * 2. Call `Address.generateStealthPayment(viewPub, spendPub)`
 * 3. Send tokens to `stealthAddress`
 * 4. Publish `ephemeralPublicKey` on-chain (in event/logs)
 * 5. Optionally keep `sharedSecret` for reference
 *
 * ## On-Chain Announcement:
 * ```solidity
 * event StealthPaymentAnnounced(
 *   address indexed stealthAddress,
 *   bytes ephemeralPublicKey,
 *   address indexed sender
 * );
 * ```
 *
 * ## Privacy:
 * - `stealthAddress`: Looks like random Ethereum address (unlinkable)
 * - `ephemeralPublicKey`: Random-looking public key (no metadata leaked)
 * - `sharedSecret`: Only sender knows (optional, for auditing)
 *
 * @example
 * ```typescript
 * // Generate stealth payment to Alice
 * const aliceKeys = await contract.getMetaAddress("alice");
 * const payment = Address.generateStealthPayment(
 *   aliceKeys.metaViewingPub,
 *   aliceKeys.metaSpendingPub
 * );
 *
 * // Send IDRX to stealth address
 * const tx = await idrxContract.transfer(
 *   payment.stealthAddress,
 *   parseEther("100")
 * );
 *
 * // Announce payment on-chain
 * await contract.announcePayment(
 *   payment.stealthAddress,
 *   payment.ephemeralPublicKey
 * );
 * ```
 */
export interface StealthPaymentGeneration {
  /** Stealth address to send payment to (20 bytes) - One-time use address */
  stealthAddress: Uint8Array;
  /** Ephemeral public key to publish on-chain (33 bytes compressed) - For recipient scanning */
  ephemeralPublicKey: Uint8Array;
  /** Shared secret used for derivation (32 bytes, optional) - For sender's records only */
  sharedSecret?: Uint8Array;
}

/**
 * Payment scan result
 *
 * Result of scanning a stealth payment to check if it belongs to you.
 * Returned by payment scanning utilities when checking announced payments.
 *
 * ## Recipient Workflow:
 * 1. Fetch announced payments from blockchain
 * 2. For each payment, check if it's for you using viewing key
 * 3. If `isForMe === true`, save payment to database
 * 4. When ready to spend, derive `stealthPrivateKey` using spending key
 *
 * ## Privacy-Preserving Scanning:
 * - Viewing key can scan without spending capability
 * - Can delegate scanning to untrusted server (view-only)
 * - Spending key only needed when claiming payment
 *
 * ## Storage Strategy:
 * ```typescript
 * if (scanResult.isForMe) {
 *   // Save to IndexedDB for later claiming
 *   await db.payments.add({
 *     ...scanResult.payment,
 *     claimed: false
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Scan for my payments
 * const announcements = await contract.getPaymentAnnouncements(fromBlock, toBlock);
 *
 * for (const announcement of announcements) {
 *   const result: PaymentScanResult = {
 *     payment: {
 *       stealthAddress: announcement.stealthAddress,
 *       amount: announcement.amount,
 *       ephemeralPubkey: announcement.ephemeralPubkey,
 *       ephemeralPubkeyHash: keccak256(announcement.ephemeralPubkey),
 *       sender: announcement.sender,
 *       timestamp: announcement.timestamp,
 *       claimed: false,
 *       blockNumber: announcement.blockNumber,
 *       transactionHash: announcement.txHash
 *     },
 *     isForMe: Address.checkStealthPayment(...).isForMe,
 *     stealthPrivateKey: undefined // Derived later when spending
 *   };
 *
 *   if (result.isForMe) {
 *     await savePayment(result.payment);
 *   }
 * }
 * ```
 */
export interface PaymentScanResult {
  /** Complete stealth payment information from blockchain */
  payment: StealthPayment;
  /** Whether this payment belongs to you (detected using viewing key) */
  isForMe: boolean;
  /** Stealth private key for spending (32 bytes, only derived when claiming) */
  stealthPrivateKey?: Uint8Array;
}

/**
 * Scanner configuration
 *
 * Configuration for blockchain scanner that detects stealth payments.
 * Controls how the scanner fetches and processes payment announcements.
 *
 * ## Scanning Strategy:
 * 1. **Initial Scan**: Scan from user registration block to current block
 * 2. **Continuous Polling**: Poll for new payments at regular intervals
 * 3. **Batch Processing**: Process blocks in batches to avoid RPC limits
 *
 * ## Performance Tuning:
 * - **Large batchSize**: Faster initial sync, higher RPC load
 * - **Small batchSize**: Slower sync, lower RPC load, better for rate limits
 * - **Short pollInterval**: Real-time updates, more RPC calls
 * - **Long pollInterval**: Delayed updates, fewer RPC calls
 *
 * ## Recommended Settings:
 * ```typescript
 * // Initial sync (catch up fast)
 * const initialConfig: ScannerConfig = {
 *   fromBlock: registrationBlock,
 *   toBlock: 'latest',
 *   batchSize: 10000,  // Large batches
 *   pollInterval: 0     // No polling during initial sync
 * };
 *
 * // Live scanning (real-time)
 * const liveConfig: ScannerConfig = {
 *   fromBlock: 'latest',
 *   toBlock: 'latest',
 *   batchSize: 100,     // Small batches
 *   pollInterval: 12000 // Poll every 12 seconds (1 block on Ethereum)
 * };
 * ```
 *
 * @example
 * ```typescript
 * const config: ScannerConfig = {
 *   fromBlock: 12345678,  // Start from registration block
 *   toBlock: 'latest',     // Scan to latest block
 *   batchSize: 5000,       // Process 5000 blocks at a time
 *   pollInterval: 15000    // Check for new blocks every 15 seconds
 * };
 *
 * const scanner = new PaymentScanner(config);
 * scanner.on('payment', (payment) => {
 *   console.log('New payment detected!', payment);
 * });
 * await scanner.start();
 * ```
 */
export interface ScannerConfig {
  /** Starting block number or 'latest' for current block */
  fromBlock: number | 'latest';
  /** Ending block number or 'latest' for current block (updates continuously if 'latest') */
  toBlock: number | 'latest';
  /** Number of blocks to process in each batch (affects RPC load) */
  batchSize: number;
  /** Milliseconds between polling for new blocks (0 = no polling) */
  pollInterval: number;
}

/**
 * Claim proof inputs
 *
 * Inputs required to generate a zero-knowledge proof for claiming a stealth payment.
 * Proves ownership of a stealth payment without revealing the link to meta-address.
 *
 * ## Purpose:
 * Generate a ZK proof that proves:
 * 1. You own the viewing and spending private keys for a meta-address
 * 2. The stealth address was derived from your meta-address
 * 3. You can rightfully claim the payment
 * Without revealing:
 * - Your meta viewing/spending private keys
 * - The link between stealth address and your meta-address
 * - Your identity or username
 *
 * ## ZK Proof Circuit:
 * ```
 * Public Inputs:
 *   - stealthAddress (20 bytes)
 *   - claimerAddress (20 bytes)
 *   - metaSpendingPub (33 bytes)
 *   - ephemeralPubkey (33 bytes)
 *
 * Private Inputs:
 *   - metaViewingPriv (32 bytes)
 *
 * Proof Statement:
 *   sharedSecret = metaViewingPriv · ephemeralPubkey
 *   derivedStealthAddr = keccak256(metaSpendingPub + hash(sharedSecret)·G)[12:32]
 *   assert(derivedStealthAddr == stealthAddress)
 *   assert(claimerAddress == claimerAddress)
 * ```
 *
 * ## Use Case:
 * When withdrawing from a stealth address to your main wallet,
 * the ZK proof allows the smart contract to verify you're the rightful
 * owner without revealing which meta-address received the payment.
 *
 * @example
 * ```typescript
 * // Prepare inputs for ZK proof
 * const proofInputs: ClaimProofInputs = {
 *   metaViewingPriv: myViewingPrivKey,        // Private (not revealed)
 *   metaSpendingPub: mySpendingPubKey,        // Public (known on-chain)
 *   ephemeralPubkey: payment.ephemeralPubkey, // Public (from announcement)
 *   stealthAddress: payment.stealthAddress,   // Public (where funds are)
 *   claimerAddress: myMainWallet.address      // Public (where to send funds)
 * };
 *
 * // Generate ZK proof
 * const proof = await generateClaimProof(proofInputs);
 *
 * // Submit claim with proof
 * await contract.claimPayment(
 *   payment.stealthAddress,
 *   myMainWallet.address,
 *   proof
 * );
 * ```
 */
export interface ClaimProofInputs {
  /** Meta viewing private key (32 bytes) - Private witness, not revealed in proof */
  metaViewingPriv: Uint8Array;
  /** Meta spending public key (33 bytes compressed) - Public input to proof */
  metaSpendingPub: Uint8Array;
  /** Ephemeral public key from payment announcement (33 bytes compressed) - Public input */
  ephemeralPubkey: Uint8Array;
  /** Stealth address containing the payment (20 bytes) - Public input */
  stealthAddress: Uint8Array;
  /** Destination address for claimed funds (20 bytes) - Public input */
  claimerAddress: Uint8Array;
}
