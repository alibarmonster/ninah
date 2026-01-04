'use client';

import { useUserByUsername } from '@/hooks/useUserByUsername';
import { PaymentProfile } from '@/components/payment/PaymentProfile';
import { useParams } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { user, loading, error } = useUserByUsername(username);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-black">
         <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-2">404</h1>
            <p className="text-neutral-500">User @{username} not found</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-black/[0.05] dark:bg-grid-white/[0.05] bg-neutral-50 dark:bg-black flex items-center justify-center p-4">
      <PaymentProfile 
        username={user.username}
        avatar={user.avatar}
        metaViewingPub={user.metaViewingPub}
        metaSpendingPub={user.metaSpendingPub}
      />
    </div>
  );
}
