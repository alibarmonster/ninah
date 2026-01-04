import { useState, useEffect } from 'react';
import { Secp256k1 } from '@/lib/crypto/secp256k1';
import { Bytes } from '@/lib/helpers/bytes';

interface UserProfile {
  username: string;
  avatar: string; // URL
  address: string; // Ethereum address
  metaViewingPub: string; // Hex string
  metaSpendingPub: string; // Hex string
}

/**
 * Hook to fetch user data by username
 *
 * TODO: Replace mock implementation with real contract call:
 * - Call Registry Contract to get stealth meta-addresses
 * - const { metaViewingPub, metaSpendingPub } = await registryContract.getStealthMeta(username);
 * - Fetch user avatar from IPFS or on-chain metadata
 */
export function useUserByUsername(username: string) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Generate deterministic-ish keys based on username length for "consistency"
        // But for crypto validity, we just generate valid random keys for now.
        // In a real app we'd fetch these from the contract.
        
        // Mock Keys: We need valid compressed public keys (33 bytes)
        // We start with random private keys to ensure validity
        const mockViewingPriv = crypto.getRandomValues(new Uint8Array(32));
        const mockSpendingPriv = crypto.getRandomValues(new Uint8Array(32));

        const viewingPub = Secp256k1.privateKeyToPublicKey(mockViewingPriv);
        const spendingPub = Secp256k1.privateKeyToPublicKey(mockSpendingPriv);

        setUser({
          username: decodeURIComponent(username),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          address: '0x123...mock', 
          metaViewingPub: '0x' + Bytes.bytesToHex(viewingPub),
          metaSpendingPub: '0x' + Bytes.bytesToHex(spendingPub),
        });
      } catch (err) {
        setError('Failed to fetch user');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  return { user, loading, error };
}
