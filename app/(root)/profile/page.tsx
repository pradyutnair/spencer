import { createSessionClient } from '@/lib/appwrite';
import { getLoggedInUser } from '@/lib/user.actions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import React from 'react';

export async function signOut() {
  'use server';

  const { account } = await createSessionClient();

  cookies().delete('appwrite-session');
  await account.deleteSession('current');

  redirect('/sign-up');
}

export default async function HomePage() {
  let user = await getLoggedInUser();
  if (!user) {
    user = { email: 'loading...', name: 'loading...', $id: 'loading...' };
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl items-start gap-6 px-6 py-20 md:grid-cols-[250px_1fr]">
      <div className="space-y-1">
        <Link
          href="#"
          className="flex items-center space-x-2 rounded-md bg-gray-100 py-2 text-sm font-medium"
          prefetch={false}
        >
          <UserIcon className="h-6 w-6" />
          Profile Information
        </Link>
        <Link
          href="#"
          className="flex items-center space-x-2 rounded-md py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          prefetch={false}
        >
          <LockIcon className="h-6 w-6" />
          Privacy Settings
        </Link>
        <Link
          href="#"
          className="flex items-center space-x-2 rounded-md py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          prefetch={false}
        >
          <LockIcon className="h-6 w-6" />
          Account Security
        </Link>
        <Link
          href="#"
          className="flex items-center space-x-2 rounded-md py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          prefetch={false}
        >
          <BellIcon className="h-6 w-6" />
          Notifications
        </Link>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-sm">
            Name
          </Label>
          <Input id="name" value={user.name} readOnly />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm">
            Email
          </Label>
          <Input id="email" type="email" value={user.email} readOnly />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language" className="text-sm">
            Language
          </Label>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Languages</SelectLabel>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timezone" className="text-sm">
            Timezone
          </Label>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Timezones</SelectLabel>
                <SelectItem value="utc-11">(UTC-11:00) Niue</SelectItem>
                <SelectItem value="utc-10">(UTC-10:00) Hawaii</SelectItem>
                <SelectItem value="utc-9">(UTC-09:00) Alaska</SelectItem>
                <SelectItem value="utc-8">
                  (UTC-08:00) Pacific Time (US & Canada)
                </SelectItem>
                <SelectItem value="utc-7">
                  (UTC-07:00) Mountain Time (US & Canada)
                </SelectItem>
                <SelectItem value="utc-6">
                  (UTC-06:00) Central Time (US & Canada)
                </SelectItem>
                <SelectItem value="utc-5">
                  (UTC-05:00) Eastern Time (US & Canada)
                </SelectItem>
                <SelectItem value="utc-4">
                  (UTC-04:00) Atlantic Time (Canada)
                </SelectItem>
                <SelectItem value="utc-3:30">
                  (UTC-03:30) Newfoundland
                </SelectItem>
                <SelectItem value="utc+0">
                  (UTC+00:00) Greenwich Mean Time
                </SelectItem>
                <SelectItem value="utc+1">
                  (UTC+01:00) Central European Time
                </SelectItem>
                <SelectItem value="utc+2">
                  (UTC+02:00) Eastern European Time
                </SelectItem>
                <SelectItem value="utc+3">
                  (UTC+03:00) Moscow Standard Time
                </SelectItem>
                <SelectItem value="utc+3:30">
                  (UTC+03:30) Iran Standard Time
                </SelectItem>
                <SelectItem value="utc+4">
                  (UTC+04:00) Gulf Standard Time
                </SelectItem>
                <SelectItem value="utc+4:30">
                  (UTC+04:30) Afghanistan Time
                </SelectItem>
                <SelectItem value="utc+5">
                  (UTC+05:00) Pakistan Standard Time
                </SelectItem>
                <SelectItem value="utc+5:30">
                  (UTC+05:30) Indian Standard Time
                </SelectItem>
                <SelectItem value="utc+5:45">(UTC+05:45) Nepal Time</SelectItem>
                <SelectItem value="utc+6">
                  (UTC+06:00) Bangladesh Standard Time
                </SelectItem>
                <SelectItem value="utc+6:30">
                  (UTC+06:30) Cocos Islands Time
                </SelectItem>
                <SelectItem value="utc+7">
                  (UTC+07:00) Indochina Time
                </SelectItem>
                <SelectItem value="utc+8">
                  (UTC+08:00) China Standard Time
                </SelectItem>
                <SelectItem value="utc+8:45">
                  (UTC+08:45) Southeastern Western Australia Standard Time
                </SelectItem>
                <SelectItem value="utc+9">
                  (UTC+09:00) Japan Standard Time
                </SelectItem>
                <SelectItem value="utc+9:30">
                  (UTC+09:30) Australian Central Standard Time
                </SelectItem>
                <SelectItem value="utc+10">
                  (UTC+10:00) Australian Eastern Standard Time
                </SelectItem>
                <SelectItem value="utc+10:30">
                  (UTC+10:30) Lord Howe Standard Time
                </SelectItem>
                <SelectItem value="utc+11">
                  (UTC+11:00) Solomon Islands Time
                </SelectItem>
                <SelectItem value="utc+11:30">
                  (UTC+11:30) Norfolk Island Time
                </SelectItem>
                <SelectItem value="utc+12">
                  (UTC+12:00) New Zealand Standard Time
                </SelectItem>
                <SelectItem value="utc+12:45">
                  (UTC+12:45) Chatham Islands Time
                </SelectItem>
                <SelectItem value="utc+13">
                  (UTC+13:00) Phoenix Islands Time
                </SelectItem>
                <SelectItem value="utc+14">
                  (UTC+14:00) Line Islands Time
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <form action={signOut}>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
            <Button type="submit" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BellIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
