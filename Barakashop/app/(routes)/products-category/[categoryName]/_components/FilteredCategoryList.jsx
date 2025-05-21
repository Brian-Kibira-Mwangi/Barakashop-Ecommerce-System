import React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Link from 'next/link'
import Image from 'next/image'
function FilteredCategoryList({categoryList}) {
  return (
    <div className='mt-5 max-w-7xl mx-auto px-4'>
      <h2 className='text-green-600 font-bold text-2xl'>Shop by category</h2>
      <div className=' flex justify-center'>
        <Carousel className="w-[90vw] mt-4">
          <CarouselContent className="flex ml-12">
            {categoryList.map((category, index) => (
              <CarouselItem key={index} className="basis-1/5">
                {}
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

export default FilteredCategoryList