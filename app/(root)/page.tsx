import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLoggedInUser } from '@/lib/user.actions';

import CustomCard from '@/components/custom-card';
import React from 'react';
import SelectCurrency from '@/components/buttons/select-currency';

export default async function page() {
  const user = await getLoggedInUser();
  const firstname = user.name.split(' ')[0] as string;
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2 pt-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstname}👋
          </h2>
          <div className="hidden items-center space-x-2 md:flex">
            <CalendarDateRangePicker />
            <SelectCurrency />
          </div>
        </div>
            <CustomCard firstname={firstname} />
      </div>
    </ScrollArea>
  );
}
