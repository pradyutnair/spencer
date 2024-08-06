'use client';
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { getLoggedInUser, getUserDetails, logoutAccount } from '@/lib/user.actions';
import { generateGradient } from '@/lib/colourUtils';

export function UserNav() {
  const [user, setUser] = useState({ name: '', email: '', image: '' });

  useEffect(() => {
    const fetchUser = async () => {
      const loggedInUser = await getLoggedInUser();
      const userData = await getUserDetails(loggedInUser.$id);
      const firstName = userData.firstName;
      const lastName = userData.lastName;
      setUser({
        name: `${firstName} ${lastName}`,
        email: userData.email,
        image: userData.avatarUrl,
      });
    };
    fetchUser();
  }, []);

  const gradientBackground = generateGradient(user.name.split(' ')[0], user.name.split(' ')[1]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative mr-4 h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9" style={{ background: gradientBackground }}>
          <AvatarImage src={user.image ?? ''} alt={user.name ?? ''} className="bg-transparent" />
          <AvatarFallback className="bg-transparent" style={{ background: gradientBackground }}>
            {user.name ? user.name.split(' ').map(n => n[0]).join('') : ''}
          </AvatarFallback>
        </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/profile?tab=billing">
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          </Link>
          <Link href="/profile?tab=bank">
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          </Link>
          <form action={logoutAccount}>
            <Button variant="ghost" type="submit" className="w-full text-left hover:text-red-600">
              Sign out
            </Button>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}