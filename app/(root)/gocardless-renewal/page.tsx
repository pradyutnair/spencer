'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoCardlessRedirect() {
  const router = useRouter();

  useEffect(() => {
    const completeRequisition = async () => {
      const newRequisitionString = localStorage.getItem(
        'newRequisitionDetails'
      );
      if (!newRequisitionString) {
        return;
      }

      const newRequisition = JSON.parse(newRequisitionString);

      try {
        const response = await fetch('/api/modifyRenewedBank', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newRequisition)
        });

        if (!response.ok) {
          throw new Error('Failed to complete requisition');
        }

        localStorage.removeItem('newRequisition');
        router.push('/my-banks');
      } catch (error) {
        console.error('Error completing requisition:', error);
      }
    };

    completeRequisition();
  }, [router]);

  return (
    <div>
      <h1>GoCardless Renewal</h1>
    </div>
  );
}