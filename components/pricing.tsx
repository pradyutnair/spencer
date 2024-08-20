export const PackagesComponent = () => {
    return (
        <div className="mt-28">
            <h1 className="text-center text-6xl max-sm:text-5xl font-bold">
                Packages
            </h1>
            <div className="flex sm:space-x-4 max-sm:space-y-4 max-sm:flex-col">
                <div className="flex-1 text-xl mt-14 rounded-xl border border-[#4E67E5]/25 bg-[#080C23] p-10 w-full">
                    <div className="text-[#4d66e5]">Package one</div>
                    <div className="text-6xl my-5 font-light">$600</div>
                    <div>
                        Short description
                    </div>
                    <button
                        className="my-5 w-full text-black p-5 max-sm:p-2 rounded-3xl bg-[#4E67E5] text-xl max-sm:text-lg hover:bg-[#8a9dfc] transition-all"
                    >
                        Purchase
                    </button>
                    <ul>
                        <li>First feature</li>
                        <li>Second feature</li>
                    </ul>
                </div>
                <div
                    className="flex-1 text-xl mt-14 rounded-xl border border-[#9966FF]/25 bg-[#120d1d] p-10 w-full"
                >
                    <div className="text-[#9967FF]">Package 2</div>
                    <div className="text-6xl my-5 font-light">$1500</div>
                    <div>
                        Short Description
                    </div>
                    <button
                        className="my-5 w-full text-black p-5 max-sm:p-2 rounded-3xl bg-[#9966FF] text-xl max-sm:text-lg hover:bg-[#BB99FF] transition-all"
                    >
                        Purchase
                    </button>
                    <ul>
                        <li>First Feature</li>
                        <li>Second Feature</li>
                        <li>Thired Feature</li>
                    </ul>
                </div>
                <div
                    className="flex-1 text-xl mt-14 rounded-xl border border-[#F7E16F]/25 bg-[#19170d] p-10 w-full"
                >
                    <div className="text-[#F7E16F]">Package 3</div>
                    <div className="text-6xl my-5 font-light">$1800</div>
                    <div>
                        Short Description
                    </div>
                    <button
                        className="my-5 w-full text-black p-5 max-sm:p-2 rounded-3xl bg-[#F7E16F] text-xl max-sm:text-lg hover:bg-[#fdf2bb] transition-all"
                    >
                        Purchase
                    </button>
                    <ul>
                        <li>First Feature</li>
                        <li>Second Feature</li>
                        <li>Thired Feature</li>
                        <li>Fourth Feature</li>
                        <li>Fifth Feature</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
