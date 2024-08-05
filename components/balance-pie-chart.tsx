import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
  accountBalances: { bankName: string, totalBalance: number }[];
  currency: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ accountBalances, currency }) => {
  // Extract bank names and total balances from accountBalances
  const labels = accountBalances.map(({ bankName }) => processBankName(bankName));
  const data = accountBalances.map(({ totalBalance }) => totalBalance);

  // Calculate total balance
  const totalBalance = data.reduce((acc, balance) => acc + balance, 0);

  // Generate a color for each bank
  const backgroundColor = labels.map((_, index) => generateColor(index));

  // Update the data for the doughnut chart
  const doughnutData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColor,
        borderColor: '#ffffff', // Set the stroke color to white
        borderWidth: 1
      }
    ]
  };

  // Update the options for the doughnut chart
  const doughnutOptions = {
    cutout: '70%', // This makes the chart a thicker donut chart
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

            // Add currency symbol to the tooltip
            label = `${label} ${currency}`;
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-60 h-60">
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{totalBalance}</span>
        <span className="text-muted-foreground text-sm">{currency}</span>
      </div>
      <Doughnut data={doughnutData} options={doughnutOptions} />
    </div>
  );
};

export default DoughnutChart;