'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GoCardlessRedirect() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'continue-auth' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [continueLink, setContinueLink] = useState<string | null>(null);

  useEffect(() => {
    const completeRequisition = async () => {
      // Get pending requisition from localStorage
      const pendingRequisitionString = localStorage.getItem('pendingRequisition');
      
      if (!pendingRequisitionString) {
        setStatus('error');
        setErrorMessage('No pending bank connection found.');
        setTimeout(() => router.push('/my-banks'), 3000);
        return;
      }

      try {
        const pendingRequisition = JSON.parse(pendingRequisitionString);

        // Check for required fields
        if (!pendingRequisition.requisitionId) {
          throw new Error('Invalid requisition data: missing requisitionId');
        }

        // Attempt to complete the requisition
        const response = await fetch('/api/completeRequisition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pendingRequisition)
        });

        const data = await response.json();

        if (response.status === 202 && data.continueLink) {
          // Additional authorization required
          setStatus('continue-auth');
          setContinueLink(data.continueLink);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to complete bank connection');
        }

        // Success! Remove from localStorage and redirect
        localStorage.removeItem('pendingRequisition');
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1000);

      } catch (error) {
        console.error('Error completing bank connection:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    completeRequisition();
  }, [router]);

  // Handle continuing authentication if needed
  useEffect(() => {
    if (status === 'continue-auth' && continueLink) {
      // Redirect to continue the authentication process
      window.location.href = continueLink;
    }
  }, [status, continueLink]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {status === 'loading' && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Connecting your bank account</h2>
          <p className="text-muted-foreground">Please wait while we verify your connection...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-medium">Connection Failed</h2>
          <p className="text-muted-foreground max-w-md">{errorMessage}</p>
          <p className="text-sm">Redirecting you back to your banks...</p>
        </div>
      )}

      {status === 'continue-auth' && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Additional Authorization Required</h2>
          <p className="text-muted-foreground">Redirecting you to complete the authorization process...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-medium">Bank Connected Successfully!</h2>
          <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
        </div>
      )}
    </div>
  );
}