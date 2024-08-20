import { Feature } from './feature';
import { BrainIcon, ShieldIcon, DollarSignIcon } from 'lucide-react';

const features = [
  {
    title: 'AI Assistant',
    description:
      'A transparent and secure AI assistant that provides insights without storing or sharing any financial information.',
    icon: BrainIcon
  },
  {
    title: 'Privacy',
    description:
      'Your bank connections can never be used to make or receive payments, ensuring your money remains safe.',
    icon: ShieldIcon
  },
  {
    title: 'Budgeting and Expense Management',
    description:
      'Manage your finances with automatic categorization, balance overviews, and more.',
    icon: DollarSignIcon
  }
];

export const Features = () => {
  return (
    <div className="text-white py-[72px] sm:py-[90px]">
      <div className="container flex flex-col items-center">
        <h2 className="text-center font-extrabold text-4xl sm:text-6xl tracking-tighter drop-shadow-lg opacity-100 md:stroke-white stroke-2">
          All you need
        </h2>
        <div className="max-w-lg mx-auto">
          <p className="text-center mt-5 text-xl sm:text-2xl text-white/70">
            Find all the features you need in one place
          </p>
        </div>
        <div className="mt-12 flex flex-wrap gap-2 sm:gap-4 lg:gap-6 justify-center">
          {features.map(({ title, description, icon }) => (
            <Feature title={title} description={description} icon={icon} key={title} />
          ))}
        </div>
      </div>
    </div>
  );
};