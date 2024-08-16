import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { transactionCategories } from '@/lib/transactionCategoryDefinitions';
import { Transaction } from '@/types/index';
import { formatAmount } from '@/lib/utils';
import { getLoggedInUser } from '@/lib/user.actions';
import { Button } from "@/components/ui/button"; // Assuming you're using a button component
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComponentProps {
  transactions: Transaction[];
  useColorScheme: boolean;
}

export default function BudgetComponent({ transactions, useColorScheme }: ComponentProps) {
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newBudget, setNewBudget] = useState('');

  // Fetch budget data from the API
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const response = await fetch('/api/getBudgets'); // Fetching the budget data from the API
        const data = await response.json();
        const initialBudgets: Record<string, number> = {};

        if (data && data.length > 0) {
          // Map the budget data to the corresponding categories
          data.forEach((item: any) => {
            Object.keys(item).forEach((category) => {
              if (category !== 'userId' && category !== 'Income') { // Exclude Income category
                initialBudgets[category] = item[category];
              }
            });
          });
        }

        setBudgets(initialBudgets);
      } catch (error) {
        console.error('Error fetching budget data:', error);
      }
    };

    fetchBudgetData();
  }, []);

  // Calculate totals
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const newTotals = transactions.reduce((acc, transaction) => {
      const transactionDate = new Date(transaction.bookingDate);
      if (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth &&
        transaction.category &&
        !transaction.exclude &&
        transaction.category !== 'Income' && // Exclude Income category
        transaction.amount < 0 // Only consider negative amounts as expenses
      ) {
        const amount = Math.abs(transaction.amount);
        acc[transaction.category] = (acc[transaction.category] || 0) + amount;
      }
      return acc;
    }, {} as Record<string, number>);

    setTotals(newTotals);
  }, [transactions, budgets]);

  // Function to handle budget changes and update the API
  const handleBudgetChange = async (category: string, value: string) => {
    const newBudget = Math.abs(parseFloat(value)) || 0;
    setBudgets(prev => ({ ...prev, [category]: newBudget }));

    try {
      const user = await getLoggedInUser();
      const userId = user.$id;

      // Update the budget via the API
      await fetch('/api/updateBudget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          budget: { [category]: newBudget },
        }),
      });
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  // Handle new budget creation
  const handleCreateBudget = async () => {
    if (!newCategory || !Number.isInteger(parseInt(newBudget))) {
      alert('Please select a category and enter a valid budget amount.');
      return;
    }

    const newBudgetValue = Math.abs(parseInt(newBudget));
    setBudgets(prev => ({ ...prev, [newCategory]: newBudgetValue }));

    try {
      const user = await getLoggedInUser();
      const userId = user.$id;

      // Update the budget via the API
      await fetch('/api/updateBudget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          budget: { [newCategory]: newBudgetValue },
        }),
      });

      setIsModalOpen(false);
      setNewCategory('');
      setNewBudget('');
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  // Sort categories by the highest spending (descending order of progress)
  const sortedCategories = transactionCategories
    .filter(categoryInfo => categoryInfo.name !== 'Income' && budgets[categoryInfo.name] > 0) // Exclude Income category and only show budgets > 0
    .map(categoryInfo => {
      const categoryName = categoryInfo.name;
      const total = totals[categoryName] || 0;
      const budget = budgets[categoryName] || 0;
      const progress = budget > 0 ? (total / budget) * 100 : 0;

      return { categoryInfo, total, budget, progress };
    })
    .sort((a, b) => b.total - a.total);

  // Get list of categories without a budget for the select dropdown
  const categoriesWithoutBudget = transactionCategories
    .filter(categoryInfo => categoryInfo.name !== 'Income' && !budgets[categoryInfo.name])
    .map(categoryInfo => categoryInfo.name);

  return (
    <>
      <Card className="w-full max-w-2xl dark:hover:bg-gradient-to-br from-zinc-900 dark:bg-zinc-950 overflow-y-auto invisible-scroll">
        <CardHeader>
          <CardTitle className="">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 overflow-y-auto">
          {sortedCategories.map(({ categoryInfo, total, budget, progress }) => {
            const categoryName = categoryInfo.name;

            const progressColor = useColorScheme ? categoryInfo.darkTextClass : 'black';
            const textColor = useColorScheme ? categoryInfo.darkTextClass : 'light:text-black dark:text-white';

            return (
              <div key={categoryName} className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: useColorScheme ? categoryInfo.categoryColor : 'white' }}
                    />
                    <span className={`text-base font-medium ${textColor}`}>{categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base text-muted-foreground">
                      {formatAmount(total)}
                    </span>
                    <span className="text-base text-muted-foreground">/</span>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => handleBudgetChange(categoryName, e.target.value)}
                      className="w-24 text-right"
                    />
                  </div>
                </div>
                <Progress
                  value={progress}
                  className={`[&>*]:dark:bg-white [&>*]light:bg-black`}
                />
              </div>
            );
          })}
          {useColorScheme && (
          <Button onClick={() => setIsModalOpen(true)}>Create Budget</Button>
          )}
        </CardContent>
      </Card>

      {isModalOpen && useColorScheme && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <Card className="p-4 w-full max-w-md mx-auto">
            <CardTitle>Create a New Budget</CardTitle>
            <Select
              onValueChange={(value) => setNewCategory(value)}
            >
              <SelectTrigger className="w-full mt-4">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categories</SelectLabel>
                  {categoriesWithoutBudget.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              label="Budget Amount"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="Enter a budget amount"
              className="mt-4"
            />
            <Button onClick={handleCreateBudget} className="mt-4">Save Budget</Button>
            <Button onClick={() => setIsModalOpen(false)} className="mt-2 ml-2 hover:text-red-600">Cancel</Button>
          </Card>
        </div>
      )}
      <style jsx>{`
        @media (max-width: 768px) {
          .text-base {
            font-size: 0.875rem;
          }
          .w-24 {
            width: 5rem;
          }
        }
      `}</style>
    </>
  );
}