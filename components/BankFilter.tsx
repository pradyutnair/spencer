import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const BankFilterDropdown = ({ column }) => {
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const uniqueBanks = Array.from(column.getFacetedUniqueValues().keys());

  useEffect(() => {
    column.setFilterValue(selectedBanks.length ? selectedBanks : undefined);
  }, [selectedBanks, column]);

  const toggleBank = (bank: string) => {
    setSelectedBanks((prev) =>
      prev.includes(bank) ? prev.filter((b) => b !== bank) : [...prev, bank]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {uniqueBanks.map((bank) => (
          <DropdownMenuCheckboxItem
            key={bank}
            checked={selectedBanks.includes(bank)}
            onCheckedChange={() => toggleBank(bank)}
          >
            {bank}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BankFilterDropdown;