import { BanknoteIcon, CoffeeIcon } from "lucide-react";
import { Feature } from "./feature";

const features = [
  {
    title: "Feature 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    title: "Feature 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    title: "Feature 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

export const Features = () => {
  return (
    <div className="text-white py-[72px] sm:py-[90px]">
      <div className="container">
        <h2 className="text-center font-extrabold text-6xl tracking-tighter bg-clip-text drop-shadow-lg opacity-100">
          All you need
        </h2>
        <div className="max-w-lg mx-auto">
          <p className="text-center mt-5 text-xl sm:text-2xl text-white/70">
            Find all the features you need in one place
          </p>
        </div>
        <div className="mt-16 flex flex-col sm:flex-row gap-4">
          {features.map(({ title, description }) => (
            <Feature title={title} description={description} key={title} />
          ))}
        </div>
      </div>
    </div>
  );
};