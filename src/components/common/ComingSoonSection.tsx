import Image from "next/image";

const ComingSoonSection = () => {
    return (
        <section className="relative flex items-center justify-center h-screen">
            <Image
                src="/images/ComingSoon.jpg"
                alt="Hotel background"
                fill
                priority
                className="object-cover"
            />

            <div className="absolute inset-0 bg-black/30" />
        </section>
    )
}

export default ComingSoonSection