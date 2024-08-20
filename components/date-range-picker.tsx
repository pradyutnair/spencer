'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { DateRange } from 'react-day-picker';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import {
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function CalendarDateRangePicker() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const { setDateRange } = useDateRangeStore();

  const presets = [
    {
      label: 'Year To Date',
      range: () => ({ from: startOfYear(new Date()), to: new Date() })
    },
    {
      label: 'Month To Date',
      range: () => ({ from: startOfMonth(new Date()), to: new Date() })
    },
    {
      label: 'Week To Date',
      range: () => ({ from: startOfWeek(new Date()), to: new Date() })
    },
    {
      label: 'Past Month',
      range: () => ({ from: subMonths(new Date(), 1), to: new Date() })
    },
    {
      label: 'Past Week',
      range: () => ({ from: subWeeks(new Date(), 1), to: new Date() })
    },
    {
      label: 'Past Year',
      range: () => ({ from: subYears(new Date(), 1), to: new Date() })
    },
    {
      label: 'All Time',
      range: () => ({ from: new Date('2023-01-01'), to: new Date() })
    }
  ];

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDateRange(newDate);
    setDate(newDate);
    console.log('Selected date range:', newDate);
  };

  const handlePresetSelect = (presetRange: () => DateRange) => {
    const newDate = presetRange();
    setDateRange(newDate);
    setDate(newDate);
    console.log('Selected date range from preset:', newDate);
  };

  return (
    <div className={cn('grid gap-2')}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto flex-col items-center p-0"
          align="end"
        >
          <div className="flex w-full justify-center p-4">
            <Select
              onValueChange={(value) => {
                const preset = presets.find((p) => p.label === value);
                if (preset) {
                  handlePresetSelect(preset.range);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {presets.map((preset, index) => (
                    <SelectItem key={index} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
