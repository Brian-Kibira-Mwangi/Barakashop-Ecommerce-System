import React from 'react';
import GlobalApi from "@/app/_utils/GlobalApi";
import FilteredCategoryList from './_components/FilteredCategoryList';
import FilteredProductList from './_components/FilteredProductList';

async function ProductCategory({ params }) {
  // Await the params if necessary
  const { categoryName } = params;

  // Decode the category name to handle spaces correctly
  const decodedCategoryName = decodeURIComponent(categoryName);

  if (!decodedCategoryName) {
    return <div>Error: No category provided</div>;
  }

  try {
    const productList = await GlobalApi.getProductsByCategory(decodedCategoryName);
    const categoryList = await GlobalApi.getCategoryList();
    const modelList = await GlobalApi.getFilteredModels(decodedCategoryName);
    const colorInfoList = await GlobalApi.getColorDetails();

    return (
      <div>
        <h2 className='p-4 bg-primary text-white font-bold text-3xl text-center'>
          {decodedCategoryName}
        </h2>
        <FilteredCategoryList categoryList={categoryList} />
        <FilteredProductList modelList={modelList} colorInfoList={colorInfoList} />
      </div>
    );
  } catch (error) {
    console.error("Error in ProductCategory:", error);
    return <div>Error loading products. Please try again later.</div>;
  }
}

export default ProductCategory;
