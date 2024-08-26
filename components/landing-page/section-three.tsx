import Image from 'next/image';

export function SectionThree() {
  return (
    <section className="mb-12 flex flex-col justify-between space-y-12 overflow-hidden md:flex-row md:space-x-8 md:space-y-0">
      <div className="flex basis-1/3 flex-col border border-border bg-[#121212] p-10 md:text-center">
        <span className="mb-4 self-start rounded-full border border-border bg-[#1D1D1D] px-3 py-1.5 font-mono text-xs font-medium text-[#F5F5F3]">
          Coming soon
        </span>
        <h4 className="mb-4 text-xl font-medium md:text-2xl">
          Singular Banking
        </h4>
        <p className="mb-[35px] text-sm text-[#878787]">
          We are making great strides to offer users to have a singular Nexpass
          account to handle ALL bank accounts and respective expenditures.
        </p>

        <Image
          src={''}
          quality={100}
          className="mt-auto object-contain"
          alt="Invoice"
        />
      </div>

      <div className="flex flex-col justify-between border border-border bg-[#121212] p-10 md:basis-2/3 md:flex-row md:space-x-8">
        <div className="flex flex-col md:basis-1/2">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">Magic inbox</h4>

          <p className="mb-4 text-sm text-[#878787]">
            Automatic matching of incoming invoices or receipts to the right
            transaction.
          </p>

          <ul className="list-decimal space-y-3 pl-4">
            <li className="text-sm text-[#878787]">
              Use your personalized email address for your invoices and
              receipts.
            </li>
            <li className="text-sm text-[#878787]">
              The invoice arrives in the inbox, with our AI solution the invoice
              automatically matches with the right transaction.
            </li>
            <li className="text-sm text-[#878787]">
              Your transaction now have the right basis/attachments for you to
              export.
            </li>
          </ul>
        </div>

        <div className="relative md:mt-0 md:basis-1/2">
          <Image
            src={'/transactions.png'}
            width={500}
            height={750}
            quality={100}
            className="relative -bottom-[32px]"
            alt="Inbox"
          />
        </div>
      </div>
    </section>
  );
}
