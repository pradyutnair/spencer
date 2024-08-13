import Image from 'next/image';

export function SectionTwo() {
  return (
    <section className="container mb-12 overflow-hidden border border-border bg-[#121212] md:pb-0">
      <div className="flex flex-col md:flex-row md:space-x-12">
        <Image
          src={'/dashboard.png'}
          height={446}
          width={836}
          className="-mb-[1px] object-contain"
          alt="Overview"
          quality={100}
        />

        <div className="mt-6 flex flex-col justify-center p-8 md:mb-8 md:ml-8 md:max-w-[40%] md:p-0">
          <h3 className="mb-4 text-xl font-medium md:text-2xl">
            Financial overview
          </h3>

          <p className="mb-4 text-sm text-[#878787]">
            Choose your bank and stay in control. We seamlessly integrate with
            your bank and track your earnings and expenditures effortlessly,
            giving you a comprehensive view of your business’s financial
            performance and current status.
          </p>

          <div className="mt-8 flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={13}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
              />
            </svg>
            <span className="text-sm text-[#878787]">Expenditure Graphs</span>
          </div>
          <div className="mt-5 flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={13}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
              />
            </svg>
            <span className="text-sm text-[#878787]">Balance Breakdowns</span>
          </div>
          <div className="mt-5 flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={13}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
              />
            </svg>
            <span className="text-sm text-[#878787]">Setting your Budgets</span>
          </div>
        </div>
      </div>
    </section>
  );
}
