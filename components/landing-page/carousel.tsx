import Image from "next/image"
import Visa from "../public/icons/visa.svg"
import { Testimonial } from "./testimonial"


const comments = [
    {
        picture: '../public/yechach.png',
        name: 'Yeshas',

    },
    {
        title: 'Feature 1',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {

        title: 'Feature 1',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    }
]

export const Carousel = () => {

    return (
        <div className="text-white">
            <div className="container">
                <h2>What the people have to say</h2>
                <div>
                    {/* <Testimonial picture=", name={} */}
                </div>
            </div>
        </div>
    )
}