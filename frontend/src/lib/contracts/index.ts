// Client utilities
export { publicClient, createPrivyWalletClient } from '@/lib/contracts/client';

// ABIs
export { NinahABI, MockIDRXABI } from '@/lib/contracts/abi';

// Addresses
export { contractAddress } from '@/lib/contracts/addresses';

// NinjaRupiah contract functions
export {
  isUsernameAvailable,
  getUsernameHash,
  getMetaKeys,
  getStealthPayment,
  registerUsername,
  registerMetaKeys,
  sendToStealth,
  claimFromStealth,
} from '@/lib/contracts/NinjaRupiah';

// IDRX token functions
export { getBalance, getAllowance, getDecimals, approve, approveNinjaRupiah, transfer } from '@/lib/contracts/MockIDRX';

// Event types
export type {
  UsernameRegisteredEvent,
  MetaKeysRegisteredEvent,
  StealthPaymentSentEvent,
  StealthPaymentClaimedEvent,
} from '@/lib/contracts/events';
