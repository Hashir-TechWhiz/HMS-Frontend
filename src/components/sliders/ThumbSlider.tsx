'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';
import { FreeMode, Thumbs, Autoplay, EffectFade } from 'swiper/modules';

interface IThumbSlider {
    images: string[];
    name?: string;
}

const ThumbSlider: React.FC<IThumbSlider> = ({ images, name }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType>();
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px] rounded-xl bg-gray-100 text-gray-500">
                No images available
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Main Product Image Slider */}
            <Swiper
                className="w-full h-full"
                loop
                effect="fade"
                fadeEffect={{ crossFade: true }}
                spaceBetween={10}
                autoplay={{
                    delay: 3500,
                    disableOnInteraction: false,
                }}
                thumbs={{ swiper: thumbsSwiper }}
                modules={[FreeMode, Thumbs, Autoplay, EffectFade]}
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            >
                {images.map((img, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative w-full h-full min-h-60 transition-all duration-300 rounded-lg overflow-hidden">
                            <Image
                                src={img}
                                alt={`${name || 'Product'} image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Thumbnail Slider */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[85%] sm:w-[70%] max-w-full p-2 rounded-lg bg-[rgba(131,131,131,0.2)] backdrop-blur-lg z-999 border border-[#606060] box-border">
                <Swiper
                    className="w-full"
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={Math.min(images.length, 4)}
                    freeMode
                    watchSlidesProgress
                    watchOverflow
                    modules={[FreeMode, Thumbs]}
                >
                    {images.map((img, id) => (
                        <SwiperSlide key={id}>
                            <div
                                className={`relative w-full h-[35px] rounded overflow-hidden ${id === activeIndex ? 'border border-white' : ''
                                    }`}
                            >
                                <Image
                                    src={img}
                                    alt={`${name || 'Product'} thumbnail ${id + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default ThumbSlider;