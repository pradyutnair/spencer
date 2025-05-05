'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GoCardlessRenewal() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const completeRenewal = async () => {
      const newRequisitionString = localStorage.getItem('newRequisitionDetails');
      
      if (!newRequisitionString) {
        setStatus('error');
        setErrorMessage('No bank renewal information found.');
        setTimeout(() => router.push('/my-banks'), 3000);
        return;
      }

      try {
        const newRequisition = JSON.parse(newRequisitionString);

        // Check for required fields
        if (!newRequisition.newRequisitionId || !newRequisition.oldRequisitionId) {
          throw new Error('Invalid renewal data: missing requisition IDs');
        }

        // Attempt to complete the renewal
        const response = await fetch('/api/modifyRenewedBank', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newRequisition)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to renew bank connection');
        }

        // Success! Remove from localStorage and redirect
        localStorage.removeItem('newRequisitionDetails');
        setStatus('success');
        setTimeout(() => router.push('/my-banks'), 1500);

      } catch (error) {
        console.error('Error completing bank renewal:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    completeRenewal();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {status === 'loading' && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Renewing Bank Connection</h2>
          <p className="text-muted-foreground">Please wait while we verify your renewed connection...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-medium">Renewal Failed</h2>
          <p className="text-muted-foreground max-w-md">{errorMessage}</p>
          <p className="text-sm">Redirecting you back to manage your banks...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-medium">Bank Connection Renewed!</h2>
          <p className="text-muted-foreground">Your bank access has been successfully renewed.</p>
          <p className="text-sm">Redirecting you to manage your banks...</p>
        </div>
      )}
    </div>
  );
}