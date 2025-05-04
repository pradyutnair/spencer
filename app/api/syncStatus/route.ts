import { NextRequest, NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/bank.actions';

export async function GET(request: NextRequest) {
  try {
    const syncStatus = await getSyncStatus();
    
    const formatTimeRemaining = (ms: number): string => {
      if (ms === 0) return 'Now';
      
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      }
      
      return `${minutes}m`;
    };
    
    return NextResponse.json({
      transactions: {
        canSyncNow: syncStatus.transactions.canSyncNow,
        timeUntilNextSync: syncStatus.transactions.timeUntilNextSync,
        formattedTimeRemaining: formatTimeRemaining(syncStatus.transactions.timeUntilNextSync)
      },
      balances: {
        canSyncNow: syncStatus.balances.canSyncNow,
        timeUntilNextSync: syncStatus.balances.timeUntilNextSync,
        formattedTimeRemaining: formatTimeRemaining(syncStatus.balances.timeUntilNextSync)
      },
      syncsPerDay: 4,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Error getting sync status' },
      { status: 500 }
    );
  }
}