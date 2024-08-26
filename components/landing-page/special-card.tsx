import { CardSpotlight } from '@/components/ui/card-spotlight';

export function CardSpotlightDemo() {
  return (
    <CardSpotlight className="h-96 w-96">
      <p className="relative z-20 mt-2 text-xl font-bold text-white">
        Authentication steps
      </p>
      <div className="relative z-20 mt-4 text-neutral-200">
        Follow these steps to secure your account:
        <ul className="mt-2  list-none">
          <Step title="Enter your email address" />
          <Step title="Create a strong password" />
          <Step title="Set up two-factor authentication" />
          <Step title="Verify your identity" />
        </ul>
      </div>
      <p className="relative z-20 mt-4 text-sm text-neutral-300">
        Ensuring your account is properly secured helps protect your personal
        information and data.
      </p>
    </CardSpotlight>
  );
}

export const Step = ({ title }: { title: string }) => {
  return (
    <li className="flex gap-4 items-center">
      <CheckIcon />
      <p className="text-white text-lg">{title}</p>
    </li>
  );
};

const CheckIcon = () => {
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-check"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  );
};
