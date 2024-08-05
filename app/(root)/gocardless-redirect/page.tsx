'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoCardlessRedirect() {
  const router = useRouter();

  useEffect(() => {
    const completeRequisition = async () => {
      const pendingRequisitionString = localStorage.getItem('pendingRequisition');
      if (!pendingRequisitionString) {
        return;
      }

      const pendingRequisition = JSON.parse(pendingRequisitionString);

      try {
        const response = await fetch('/api/completeRequisition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pendingRequisition)
        });

        if (!response.ok) {
          throw new Error('Failed to complete requisition');
        }

        localStorage.removeItem('pendingRequisition');
        router.push('/');
      } catch (error) {
        console.error('Error completing requisition:', error);
      }
    };

    completeRequisition();
  }, [router]);

  return (
    <div>
      <h1>GoCardless Redirect</h1>
    </div>
  );
}