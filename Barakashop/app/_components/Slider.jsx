"use client"
import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

function Slider({ sliderList }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for previous

  const nextSlide = () => {
    if (currentIndex < sliderList.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full overflow-hidden">
        <Carousel className="w-full">
          <CarouselContent className="relative h-[200px] md:h-[400px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: direction * 100 }} // Enter from left or right
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -100 }} // Exit to opposite side
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute w-full"
              >
                <CarouselItem>
                  <Image
                    src={process.env.NEXT_PUBLIC_BACKEND_BASE_URL + sliderList[currentIndex]?.image?.url}
                    height={1000}
                    width={400}
                    alt="slider"
                    className="w-full h-[200px] md:h-[400px] object-cover rounded-2xl"
                  />
                </CarouselItem>
              </motion.div>
            </AnimatePresence>
          </CarouselContent>
        </Carousel>
      </div>

      {/* Buttons below the slider */}
      <div className="flex justify-center gap-4 mt-4">
        <Button variant="outline" onClick={prevSlide} disabled={currentIndex === 0}>
          Previous
        </Button>
        <Button variant="outline" onClick={nextSlide} disabled={currentIndex === sliderList.length - 1}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default Slider;
