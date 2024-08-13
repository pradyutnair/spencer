import { CoffeeIcon } from "lucide-react"
import Image from "next/image"


export const Testimonial = ({ picture, name, comment }: { picture: string, name: string, comment: string }) => {

    return (
        <div key={name} className="border border-white/30 px-5 py-10 text-center rounded-md sm:flex-1 relative">
            <div className="absolute inset-0 border-2 border-zinc-100 rounded-md"
            ></div>
            <div className="inline-flex h-12 w-12 bg-white text-zinc-950 items-center justify-center rounded-sm">
                <CoffeeIcon />
            </div>
            <Image src={picture} alt={'profile picture'} />
            <h3 className="mt-6 font-bold ">{name}</h3>
            <p className="mt-2 text-white/70">{comment}</p>
        </div>
    )
}