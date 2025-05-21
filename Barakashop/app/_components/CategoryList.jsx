import Image from 'next/image'
import Link from 'next/link'  
import React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

function CategoryList({ categoryList }) {
  return (
    <div className='mt-5'>
      <h2 className='text-green-600 font-bold text-2xl'>Shop by category</h2>
      <div className='w-full mt-4 flex justify-center'>
        <Carousel 
          className="w-full"
          opts={{
            align: "center",
          }}
        >
          <CarouselContent className="">
            {categoryList.map((category, index) => (
              <CarouselItem 
                key={index} 
                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 flex justify-center"
              >
                <Link href={'/products-category/' + category.Brand}>
                  <div className="w-[150px] h-[150px] bg-green-50 flex flex-col items-center rounded-2xl cursor-pointer">
                    <Image 
                      src={process.env.NEXT_PUBLIC_BACKEND_BASE_URL + category.Image.url}
                      height={150}  
                      width={150}  
                      alt={category.Brand}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  )
}

export default CategoryList;