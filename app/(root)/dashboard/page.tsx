import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLoggedInUser, getUserDetails } from '@/lib/user.actions';
import React from 'react';
import SelectCurrency from '@/components/buttons/select-currency';
import CustomCardWrapper from '@/components/custom-card';
import { redirect } from 'next/navigation';

export default async function page() {
  const user = await getLoggedInUser();

  let firstname;
  if (user) {
    const userData = await getUserDetails(user.$id);
     firstname = userData.firstName || 'User';
  } else {
    redirect('/login');
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2 pt-4">
          <h2 className="font-inter text-3xl font-bold tracking-tight">
            Welcome back, {firstname}👋
          </h2>
          <div className="font-inter hidden items-center space-x-2 md:flex">
            <CalendarDateRangePicker />
            <SelectCurrency />
          </div>
        </div>
        <CustomCardWrapper firstname={firstname} />
      </div>
    </ScrollArea>
  );
}
