import React from 'react'
import SearchedProductList from './_components/SearchedProductList'

import GlobalApi from "@/app/_utils/GlobalApi";
async function page({params}) {
  
  const selectedCategory = params.categoryName;
  const modelList = await GlobalApi.getSearchedModels(selectedCategory);
  const colorInfoList=await GlobalApi.getColorDetails();
  return (
    <div>
        <SearchedProductList modelList={modelList} colorInfoList={colorInfoList}/>
    </div>
  )
}

export default page