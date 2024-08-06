import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const CategoryCell = ({ category, onCategoryChange }: { category: string, onCategoryChange: (category: string) => void }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(category);

  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    onCategoryChange(newCategory);
  };

  const categories = [
    { name: "Groceries", lightColor: "text-emerald-600", darkColor: "dark:text-emerald-400" },
    { name: "Restaurant", lightColor: "text-orange-600", darkColor: "dark:text-orange-400" },
    { name: "Travel", lightColor: "text-blue-600", darkColor: "dark:text-blue-400" },
    { name: "Entertainment", lightColor: "text-purple-600", darkColor: "dark:text-purple-400" },
    { name: "Health", lightColor: "text-red-600", darkColor: "dark:text-red-400" },
    { name: "Subscriptions", lightColor: "text-indigo-600", darkColor: "dark:text-indigo-400" },
    { name: "Shopping", lightColor: "text-pink-600", darkColor: "dark:text-pink-400" },
    { name: "Transfers", lightColor: "text-cyan-600", darkColor: "dark:text-cyan-400" },
    { name: "Income", lightColor: "text-green-600", darkColor: "dark:text-green-400" },
    { name: "Finance", lightColor: "text-yellow-600", darkColor: "dark:text-yellow-400" },
    { name: "Other", lightColor: "text-gray-600", darkColor: "dark:text-gray-400" }
  ];

  const categoryItem = categories.find(cat => cat.name === selectedCategory) || categories[categories.length - 1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`w-[140px] justify-between truncate ${categoryItem.lightColor} ${categoryItem.darkColor} border-current`}
        >
          <span className="truncate">{selectedCategory || "Select"}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[150px]">
        {categories.map((cat) => (
          <DropdownMenuItem
            key={cat.name}
            onClick={() => handleCategoryChange(cat.name)}
            className={`${cat.lightColor} ${cat.darkColor} hover:bg-gray-100 dark:hover:bg-gray-800 w-[150px] truncate`}
          >
            <span className="w-full truncate text-sm">
              {cat.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoryCell;