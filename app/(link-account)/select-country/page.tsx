import React from 'react';
import {SelectCountryForm} from "@/components/forms/CountrySelectForm";
import Image from "next/image";

const CountrySelectPage = () => {
    return (
        <div className="w-full min-h-screen">
            <div className={"flex h-svh mt-28 items-center flex-col"}>
                <div className="flex  items-center mb-10">
                    <Image src={"/icons/logo.svg"}
                           alt={"logo"}
                           width={30}
                           height={30}/>
                    <div className="font-inter text-2xl font-bold ml-2 px-1">Compass</div>
                </div>
                <SelectCountryForm/>
            </div>
        </div>
    );
};

export default CountrySelectPage;