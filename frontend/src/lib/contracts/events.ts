export interface UsernameRegisteredEvent {
  username: string;
  user: `0x${string}`;
  commitment: `0x${string}`;
}

export interface MetaKeysRegisteredEvent {
  user: `0x${string}`;
  metaViewingPub: `0x${string}`;
  metaSpendingPub: `0x${string}`;
}

export interface StealthPaymentSentEvent {
  stealthAddress: `0x${string}`;
  claimer: `0x${string}`;
  amount: bigint;
  ephemeralPubkey: `0x${string}`;
}

export interface StealthPaymentClaimedEvent {
  stealthAddress: `0x${string}`;
  claimer: `0x${string}`;
  amount: bigint;
}

export interface SP1VerifierUpdatedEvent {
  oldVerifier: `0x${string}`;
  newVerifier: `0x${string}`;
}
