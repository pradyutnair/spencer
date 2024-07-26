'use client';
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
import { logoutAccount } from '@/lib/user.actions';

export function UserNav(user: any) {
  // Get the user passed down from app/root/layout -> header -> UserNav
  const user1 = user.user.user;
  const first_name = user1.name.split(' ')[0];
  const last_name = user1.name.split(' ')[1];

  if (user1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative mr-4 h-8 w-8 rounded-full"
          >
            <Avatar className="h-9 w-9 dark:bg-white">
              <AvatarImage src={user1.image ?? ''} alt={user1.name ?? ''} />
              <AvatarFallback>
                {first_name[0] + last_name[0] ?? ''}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user1.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user1.email}
              </p>
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
            <DropdownMenuItem>
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <form action={logoutAccount}>
              <Button
                variant="ghost"
                type="submit"
                className="w-full text-left"
              >
                Sign out
              </Button>
            </form>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
