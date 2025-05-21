import { Button } from "@/components/ui/button";
import Image from "next/image";
import Slider from "./_components/Slider";
import GlobalApi from "./_utils/GlobalApi";
import CategoryList from "./_components/CategoryList";
import ProductList from "./_components/ProductList";
import Footer from "./_components/Footer";
import CartWarningAlert from "./_components/CartWarningAlert";
export default async function Home(){
  const sliderList=await GlobalApi.getSliders();
  const categoryList=await GlobalApi.getCategoryList();
  const modelList=await GlobalApi.getModels();
  const colorInfoList=await GlobalApi.getColorDetails();

  return (
    <div className="p-10 px-16">
      {}
      <Slider sliderList={sliderList}/>
      <CategoryList categoryList={categoryList}/>
      <ProductList modelList={modelList} colorInfoList={colorInfoList}/>
      <Footer/>
    </div>
  );
}
