"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { ChevronLeft, ChevronRight, X } from "lucide-react"; // Import icons
import GlobalApi from '../_utils/GlobalApi';
import { useCart } from "../_context/CartContext";

function ProductList({ modelList, colorInfoList }) {
  const [inventoryDetails, setInventoryDetails]=useState([]);
    React.useEffect(() => {
      getInventoryDetails();
    }, []);
  
  const getInventoryDetails = () => {
      GlobalApi.getInventory().then(resp => {
        console.log("Fetched Inventory",resp);
        setInventoryDetails(resp);
      });
    };
    const getStockCount = (modelName, colorName, storage) => {
      const count = inventoryDetails.filter(
        (item) =>
          item.Model_ID?.Model === modelName &&
          item.Color_ID?.Color_name === colorName &&
          item.Storage === storage
      ).length;
    
      return count; // Return count (0 if no matches found)
    };
     
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [imageIndexes, setImageIndexes] = useState({});
  const { addToCart, cart } = useCart();
  
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Filter models that are in inventory
  const filteredModels = modelList.filter((model) =>
    inventoryDetails.some((item) => item.Model_ID?.Model === model.Model)
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredModels.length / productsPerPage);

  // Get models for the current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredModels.slice(indexOfFirstProduct, indexOfLastProduct);



  React.useEffect(() => {
    const initialQuantities = {};
    const initialImageIndexes = {};
    modelList.forEach((model) => {
      initialQuantities[model.Model] = 1; // Default quantity
      initialImageIndexes[model.Model] = 0; // Default image index
    });
    setQuantities(initialQuantities);
    setImageIndexes(initialImageIndexes);
  }, [modelList]); 

  const openModal = (model, quantity, currentIndex) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const closeModal = () => {
   setIsModalOpen(false);
    setSelectedModel(null);
  };

  const updateQuantity = (modelKey, newQuantity, stock) => {
    setQuantities((prev) => ({
      ...prev,
      [modelKey]: stock === 0 ? 0 : Math.max(1, newQuantity), // Ensures default of 1 if stock is available
    }));
  };
  

  const updateImageIndex = (modelKey, newIndex, totalImages) => {
    setImageIndexes((prev) => ({
      ...prev,
      [modelKey]: (newIndex + totalImages) % totalImages, // Ensure looping behavior
    }));
  };

  return (
    <div className="mt-5">
      <h2 className="text-green-600 font-bold text-2xl">Featured Products</h2>
      {inventoryDetails.length==0?(
        <p className="text-center text-gray-500 mt-4">No items available</p>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4">
        {currentProducts.map((model) => {
          const modelColors = colorInfoList.filter(
            (color) => color.Model_name.Model === model.Model
          );

          const currentIndex = imageIndexes[model.Model] || 0;
          const quantity = quantities[model.Model] || 1;

          const storage = model?.Features?.specifications
    ?.map((spec) => Object.entries(spec)[0])
    .find(([key]) => key === "Internal Memory")?.[1] || "Not Available";


          const stock = getStockCount(model.Model, modelColors[currentIndex].Color_name, storage);
          
          const cartItemCount = cart
  .filter(item => 
    item.model === model.Name &&
    item.color === modelColors[currentIndex].Color_name &&
    item.storage === storage
  )
  .reduce((total, item) => total + item.quantity, 0);

          
          return (
            <div key={model.Model} className="border p-4 rounded-lg shadow-lg w-full max-w-[300px] md:max-w-[350px] relative">
              {modelColors.length > 0 && (
                <div className="w-full mt-4 relative flex flex-col items-center">
                  <Image
                    src={process.env.NEXT_PUBLIC_BACKEND_BASE_URL + modelColors[currentIndex].Image.url}
                    width={200}
                    height={200}
                    alt={modelColors[currentIndex].Color_name}
                    className="rounded-lg"
                  />
                  <h2 className="text-center mt-2 font-medium">
                    {modelColors[currentIndex].Color_name}
                  </h2>
                  <div className="flex justify-between items-center w-full absolute bottom-[-0.5rem] left-0 px-1">
                    <Button
                      onClick={() => updateImageIndex(model.Model, currentIndex - 1, modelColors.length)}
                      variant="outline"
                      className="p-2 rounded-full shadow-md"
                    >
                      <ChevronLeft size={24} />
                    </Button>
                    <Button
                      onClick={() => updateImageIndex(model.Model, currentIndex + 1, modelColors.length)}
                      variant="outline"
                      className="p-2 rounded-full shadow-md"
                    >
                      <ChevronRight size={24} />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-center mt-4 w-full flex flex-col items-center">
                <p className={`w-full mt-4 ${getStockCount(model.Model, modelColors[currentIndex].Color_name, model.Features.specifications
                  .map((spec) => Object.entries(spec)[0])
                  .find(([key]) => key === "Internal Memory")?.[1] || "Not Available") === 0 ? 'text-cyan-50 bg-gray-800' : 'text-cyan-50 bg-gray-800'}`}>
                  {getStockCount(model.Model, modelColors[currentIndex].Color_name, model.Features.specifications
                  .map((spec) => Object.entries(spec)[0])
                  .find(([key]) => key === "Internal Memory")?.[1] || "Not Available") === 0
                  ? "Out of Stock"
                  : `Items Remaining: ${getStockCount(model.Model, modelColors[currentIndex].Color_name, model.Features.specifications
                  .map((spec) => Object.entries(spec)[0])
                  .find(([key]) => key === "Internal Memory")?.[1] || "Not Available")}`}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <h2 className="font-bold text-2xl">{model.Name}</h2>
                  <p className="text-slate-400">
                    {model.Features.specifications
                      .map((spec) => Object.entries(spec)[0]).find(([key]) => key === "Internal Memory")?.[1] || "Not Available"}
                  </p>
                </div>
              </div>
              <div className="w-full flex justify-center mt-3">
                <Button className="w-100 text-white shadow-md rounded-full" onClick={() => openModal(model,quantity,currentIndex)}>
                  View More Details
                </Button>
              </div>
              <p className="text-center mt-2 font-bold text-1xl">Ksh {model.Price}</p>
              <div className="flex items-center justify-center w-full mt-3">
                {/* Quantity Selector */}
                <div className="inline-flex items-center border border-gray-300 rounded-md h-auto w-auto">
                  <Button
                    onClick={() => updateQuantity(model.Model, quantity - 1, stock)}
                    className="h-9 w-1"
                    variant="outline"
                    disabled={quantity <= 1 || stock === 0} // Disable if stock is 0
                  >
                    −
                  </Button>
                  <span className="px-2">{stock === 0 ? 1 : quantity || 1}</span> {/* Default 1 if available */}
                  <Button
                    onClick={() => updateQuantity(model.Model, quantity + 1, stock)}
                    className="h-9 w-1"
                    variant="outline"
                    disabled={quantity >= stock || stock === 0} // Disable if stock is 0
                  >
                    +
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    // Check how many of this item (color + storage) are already in the cart
                     // Sum quantities
                    if (cartItemCount >= stock) {
                      alert(`You can't add more items to the cart than available in stock (${stock}).`);
                      return; // Prevent adding more items
                    }

                    let cleanPrice = model.Price.replace(/,/g, ""); // Remove commas from price
                    let totalPrice = Number(cleanPrice) * Number(quantity);
                    console.log("🛒 Attempting to add to cart:", {
                      model: model.Name,
                      quantity,
                      price: totalPrice,
                      color: modelColors[currentIndex].Color_name,
                      storage,
                    });
                    
                    addToCart(
                      model.Name,
                      quantity,
                      totalPrice,
                      modelColors[currentIndex].Color_name,
                      storage,
                      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}${modelColors[currentIndex].Image.url}`
                    );

                    alert(
                      `Model: ${model.Name}\nStorage: ${storage}\nQuantity: ${quantity}\nColor: ${modelColors[currentIndex].Color_name}\nPrice: Ksh ${totalPrice}`
                    );
                  }}
                  variant="default"
                  className="ml-4 px-6 py-6 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={stock === 0} // Prevent adding if out of stock
>
                   Add to Cart
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      )}
        <div className="flex justify-center mt-6 gap-4">
    {currentPage > 1 && (
      <Button onClick={() => setCurrentPage(currentPage - 1)} variant="outline">
        <ChevronLeft size={24} /> Previous
      </Button>
    )}

    {currentPage < totalPages && (
      <Button onClick={() => setCurrentPage(currentPage + 1)} variant="outline">
        Next <ChevronRight size={24} />
      </Button>
    )}
  </div>
      {/* Modal for Viewing Details */}
      {isModalOpen && selectedModel && (() => {
        const modelColors = colorInfoList.filter(
          (color) => color.Model_name.Model === selectedModel.Model
        );

        const modalCurrentIndex = imageIndexes[selectedModel.Model] || 0;

        const selectedColor = modelColors[modalCurrentIndex]?.Color_name || "Unknown Color";
        const storage = selectedModel.Features.specifications
              .find(spec => spec["Internal Memory"])?.["Internal Memory"] || "Not Available";

        const stock = getStockCount(selectedModel.Model, selectedColor, storage);  
        
        

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center w-full items-center py-3">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-[37rem] [@media(min-width:500px)]:w-[85%] 
  [@media(min-width:768px)]:w-[70%] 
  [@media(min-width:1024px)]:w-[60%] w-full relative">
              <div className="mt-4">
                <Button onClick={closeModal} className="absolute top-2 right-2 px-0 h-6 w-6">
                  <X size={10} />
                </Button>
                <div className="flex">
                  <div>
                  {modelColors.length > 0 && (
                  <div className="flex relative w-[13.2rem] justify-center">
                    <Image
                      src={process.env.NEXT_PUBLIC_BACKEND_BASE_URL + modelColors[modalCurrentIndex].Image.url}
                      width={200}
                      height={200}
                      alt={modelColors[modalCurrentIndex].Color_name}
                      className="rounded-lg"
                    />
                  </div>
                )}
                <div className="max-w-[10rem] ml-7 mt-2">
                  <p className={`text-white min-w-[1rem] px-1 flex justify-center ${stock === 0 ? 'bg-gray-800' : 'bg-gray-800'}`}>
                    {stock === 0 ? "Out of Stock" : `Items Remaining: ${stock}`}
                  </p>
                </div>
                <div className="flex items-center mt-2">
                    <Button
                      onClick={() => updateImageIndex(selectedModel.Model, modalCurrentIndex - 1, modelColors.length)}
                      variant="outline"
                      className="p-2 rounded-sm shadow-sm"
                    >
                      <ChevronLeft size={24} />
                    </Button>
                    {modelColors.length > 0 && (
                      <p className="font-medium text-center min-w-[9rem]">{modelColors[modalCurrentIndex].Color_name}</p>
                    )}
                    <Button
                      onClick={() => updateImageIndex(selectedModel.Model, modalCurrentIndex + 1, modelColors.length)}
                      variant="outline"
                      className="p-2 rounded-sm shadow-sm"
                    >
                      <ChevronRight size={24} />
                    </Button>
                </div>
                  </div>
                  <div>
                  <div className=" py-2 px-2 ml-3">
                  <div className="flex justify-center">
                    <h3 className=" font-semibold text-2xl">Features</h3>
                  </div>
                  {/* Features at the top right */}
                  <div className=" px-1 w-[19rem] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 max-h-[15rem]">
                    <ul className="list-disc pl-4">
                      {selectedModel.Features.specifications.map((spec, index) => (
                        <li key={index}>
                          <span className="font-bold">{Object.keys(spec)[0]}</span>: {Object.values(spec)[0]}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <p className="mt-2 font-bold text-3xl ml-2 text-neutral-700">Ksh {selectedModel.Price}</p>
                  <div className="inline-flex items-center border border-gray-300 rounded-md h-auto w-auto ml-11">
                    <Button
                      onClick={() => updateQuantity(selectedModel.Model, quantities[selectedModel.Model] - 1, stock)}
                      className="h-9 w-1"
                      variant="outline"
                      disabled={quantities[selectedModel.Model] <= 1 || stock === 0} // Prevent decrement below 1 or when out of stock
                    >
                      −
                    </Button>
                    <span className="px-2">{stock === 0 ? 1 : quantities[selectedModel.Model] || 1}</span> {/* Default 1 if available */}
                    <Button
                      onClick={() => updateQuantity(selectedModel.Model, quantities[selectedModel.Model] + 1, stock)}
                      className="h-9 w-1"
                      variant="outline"
                      disabled={quantities[selectedModel.Model] >= stock || stock === 0} // Prevent increment beyond stock
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      const cartItemCount = cart.filter(
                        (item) =>
                          item.model === selectedModel.Name &&
                          item.color === modelColors[modalCurrentIndex].Color_name &&
                          item.storage === storage
                      ).reduce((total, item) => total + item.quantity, 0);
                      if (cartItemCount + quantities[selectedModel.Model] > stock) {
                        alert(`You can't add more items to the cart than available in stock (${stock}).`);
                        return;
                      }
                    
                    let cleanPrice = selectedModel.Price.replace(/,/g, ""); // Removes all commas
                    let totalPrice = Number(cleanPrice) * Number(quantities[selectedModel.Model]);
                    addToCart(
                      selectedModel.Name, 
                      quantities[selectedModel.Model], 
                      totalPrice, 
                      modelColors[modalCurrentIndex].Color_name, 
                      storage, 
                      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}${modelColors[modalCurrentIndex].Image.url}` // Image URL
                    );
                    
                    alert(`Model: ${selectedModel.Name}\nStorage: ${storage}\nQuantity: ${quantities[selectedModel.Model]}\nColor: ${modelColors[modalCurrentIndex].Color_name}\nPrice: Ksh ${totalPrice}`);

                  }}
                    variant="default"
                    className="ml-4 px-6 py-6 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={stock === 0}
                  >
                    Add to Cart
                  </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default ProductList;