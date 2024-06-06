import React from 'react';
import { Icon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CustomCardProps {
  IconComponent: typeof Icon;
  amount: string;
  percentage: string;
  title: string;
}

export const CustomCard: React.FC<CustomCardProps> = ({ title, IconComponent, amount, percentage }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground"/>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{amount}</div>
        <p className="text-xs text-muted-foreground">
          {percentage} from last month
        </p>
      </CardContent>
    </Card>
  );
};