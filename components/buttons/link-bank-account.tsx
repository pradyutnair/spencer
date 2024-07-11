'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button';

export default function LinkBankAccountButton() {
  const router = useRouter()

  return (
    <Button onClick={() => router.push('/select-country')}>
      + Link another account
    </Button>
  )
}