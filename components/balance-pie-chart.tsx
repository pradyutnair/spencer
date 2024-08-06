'use client';
import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { getMainColor } from '@/lib/colourUtils';

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// Helper function to generate colors from the theme
const generateColor = (index: number) => {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];
  return colors[index % colors.length];
};

// Helper function to process bank name
const processBankName = (bankName: string) => {
  const name = bankName.split(/[^a-zA-Z0-9 ]/g)[0].toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

interface DoughnutChartProps {
  accountBalances: { bankName: string, totalBalance: number, bankLogo: string }[];
  currency: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ accountBalances, currency }) => {
  const [backgroundColor, setBackgroundColor] = useState<string[]>([]);

  useEffect(() => {
    const fetchColors = async () => {
      const colors = await Promise.all(accountBalances.map(({ bankLogo }) => getMainColor(bankLogo)));
      setBackgroundColor(colors);
    };
    fetchColors();
  }, [accountBalances]);

  const labels = accountBalances.map(({ bankName }) => processBankName(bankName));
  const data = accountBalances.map(({ totalBalance }) => totalBalance);
  const totalBalance = data.reduce((acc, balance) => acc + balance, 0);

  const doughnutData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColor,

        borderColor: '#ffffff',
        borderWidth: 0
      }
    ]
  };

  const doughnutOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: true,
        formatter: () => '',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            let label = context.parsed?.toString() || '';
            label = `${label} ${currency}`;
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-72 h-72">
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{totalBalance}</span>
        <span className="text-muted-foreground text-sm">{currency}</span>
      </div>
      <Doughnut data={doughnutData} options={doughnutOptions} />
    </div>
  );
};

export default DoughnutChart;