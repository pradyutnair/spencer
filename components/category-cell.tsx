import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { transactionCategories } from '@/lib/transactionCategoryDefinitions';

const CategoryCell = ({ category, onCategoryChange }: { category: string, onCategoryChange: (category: string) => void }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(category);

  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    onCategoryChange(newCategory);
  };

  const categoryItem = transactionCategories.find(cat => cat.name === selectedCategory) || transactionCategories[transactionCategories.length - 1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`w-[140px] justify-between truncate ${categoryItem.lightTextClass} ${categoryItem.darkTextClass} border-current`}
          //className={`w-[140px] justify-between truncate border-current text-yellow-600 dark:text-yellow-400 bg-transparent`}
        >
          <span className="truncate">{selectedCategory || "Select"}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[150px]">
        {transactionCategories.map((cat) => (
          <DropdownMenuItem
            key={cat.name}
            onSelect={() => handleCategoryChange(cat.name)}
            className={`${cat.lightTextClass} ${cat.darkTextClass}`}
          >
            {cat.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoryCell;