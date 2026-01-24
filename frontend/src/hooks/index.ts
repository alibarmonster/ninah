// Proof generation hooks (MOCK versions - generate proofs locally)
export { useUsernameProof } from './useUsernameProof';
export { useClaimingProof } from './useClaimingProof';

// Wallet and transaction hooks
export { useWalletBalance } from './useWalletBalance';
export { useStealthPayments } from './useStealthPayments';
export type { StealthTransaction } from './useStealthPayments';

// Meta keys and stealth address hooks
export { useMetaKeys } from './useMetaKeys';
export { useUsername } from './useUsername';

// Stealth claiming - stealth address as EOA
export { useStealthClaim } from './useStealthClaim';
export type { ClaimStatus, ClaimResult, StealthPaymentToClaim } from './useStealthClaim';

// Other hooks
export { useUserByUsername } from './useUserByUsername';
export { useRegisterMetaKeys } from './useRegisterMetaKeys';
export { useRegisterUsername } from './useRegisterUsername';
