'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getLoggedInUser } from '@/lib/user.actions';

export default function SelectBankForm() {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const institutionsData = localStorage.getItem('institutions');
    if (institutionsData) {
      const parsedInstitutions = JSON.parse(institutionsData);
      parsedInstitutions.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setInstitutions(parsedInstitutions);
    } else {
      router.push('/select-country');
    }

    const fetchUser = async () => {
      const loggedInUser = await getLoggedInUser();
      setUser(loggedInUser);
    };

    fetchUser();
  }, [router]);

  const handleInstitutionChange = (value: string) => {
    const institution = institutions.find((inst: any) => inst.id === value);
    setSelectedInstitution(institution);
    setOpen(false); // Close the Popover after selection
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedInstitution) {
      setError('Please select a bank.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/endUserAgreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          institutionId: selectedInstitution.id,
          logo: selectedInstitution.logo
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Initialization data:', data);

      if (data.link && data.requisitionId) {
        // Store requisition data in localStorage
        localStorage.setItem(
          'pendingRequisition',
          JSON.stringify({
            requisitionId: data.requisitionId,
            userId: user.$id,
            bankName: selectedInstitution.id,
            bankLogo: selectedInstitution.logo
          })
        );
        router.push(data.link);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-[350px]">
      <CardHeader>
        <CardTitle className="text-center text-lg">Select Bank</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    'w-full justify-between',
                    !selectedInstitution && 'text-muted-foreground'
                  )}
                >
                  {selectedInstitution ? (
                    <div className="flex items-center">
                      <img
                        src={selectedInstitution.logo}
                        alt={selectedInstitution.name}
                        className="mr-2 inline-block h-7 w-7"
                      />
                      <span>{selectedInstitution.name}</span>
                    </div>
                  ) : (
                    'Select your bank'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-h-[300px] w-[350px] overflow-hidden p-0">
                <Command>
                  <CommandInput placeholder="Search bank..." />
                  <CommandEmpty>No bank found.</CommandEmpty>
                  <CommandGroup
                    className="max-h-[220px] overflow-auto"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {institutions.map((institution: any) => (
                      <CommandItem
                        key={institution.id}
                        value={institution.name}
                        onSelect={() => handleInstitutionChange(institution.id)}
                      >
                        <div className="flex items-center">
                          <img
                            src={institution.logo}
                            alt={institution.name}
                            className="mr-2 inline-block h-7 w-7"
                          />
                          <span className="font-inter text-sm">
                            {institution.name}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            institution.id === selectedInstitution?.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {error && <div className="text-center text-red-600">{error}</div>}
            <Button
              type="submit"
              className="mt-6 w-full bg-white text-zinc-950 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Submit'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/select-country')}
              className="mb-8 mt-2 w-full bg-white text-zinc-950 hover:border-2 hover:bg-white hover:text-red-500 disabled:opacity-50"
            >
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}