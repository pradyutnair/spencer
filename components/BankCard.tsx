import React from 'react';
import Link from "next/link";
import Image from "next/image";
import {CreditCardProps} from "@/types";

const gradients = [
    'linear-gradient(to right, #ff9966, #ff5e62)',
    'linear-gradient(to right, #00F260, #0575E6)',
    'linear-gradient(to right, #e1eec3, #f05053)',
    // Add more gradients as needed
];

const BankCard = ({balances, userName, showBalance = true, bankName, bankLogo}: CreditCardProps) => {
    // Select a random gradient for each card
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    if (!balances) {
        // create a json object with the amount and currency
        balances = {amount: "0", currency: 'USD'};
    }
    if (!bankLogo) {
        // set the default bank logo
        bankLogo = '/icons/mastercard.svg';
    }

    // Split the bank name on space or underscore or hyphen and only keep the first word
    // if (bankName) {
    //     bankName = bankName.split(/[_\s-]/)[0];
    // }
    return (
        <div className="flex flex-col">
            <Link href={"/"} className="bank-card">
                <div className="bank-card_content">
                    <div>
                        <h1 className="text-16 font-semibold text-white">
                            {bankName}
                        </h1>
                        <p className="font-inter font-light text-white">
                            {balances.amount} {balances.currency}
                        </p>
                    </div>
                    <article className={"flex flex-col gap-2"}>
                        <div className="flex justify-between">
                            <h1 className={"text-14 font-semibold text-white"}>
                                {userName}
                            </h1>
                        {/*    <h2 className={"text-14 font-semibold text-white"}>*/}
                        {/*        ●● / ●●*/}
                        {/*    </h2>*/}
                        </div>
                        {/*<p className={"text-14 font-semibold tracking-[1.1px] text-white"}>*/}
                        {/*    ●●●● ●●●● ●●●● 1234*/}
                        {/*</p>*/}
                    </article>
                </div>

                <div className="bank-card_icon">
                    <Image src={"/icons/Paypass.svg"} width={20} height={24} alt={"pay"}/>
                    <Image src={bankLogo} width={45} height={32} alt={"bank logo"}
                           className={"margin-left 5"}/>
                </div>

                {/*<Image src={"/icons/lines.png"} alt={"lines"} width={316} height={190}*/}
                {/*       className={"absolute top-0 left-0"}/>*/}
            </Link>
            {/*    COPY CARD NUMBER*/}
        </div>
    );
};

export default BankCard;