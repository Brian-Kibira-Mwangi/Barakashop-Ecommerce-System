"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/app/_context/CartContext"; 

const CartWarningAlert = () => {
  const { cartWarning, setCartWarning } = useCart(); // Global warning state
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (cartWarning) {
      setShowPopup(true);
      localStorage.removeItem("cartWarning"); 
    }
  }, [cartWarning]); 

  return (
    <>
      {showPopup && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold text-red-600">⚠️ Warning</h2>
            <p className="mt-2 text-gray-700">{cartWarning}</p>
            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
              onClick={() => {
                setShowPopup(false);
                setCartWarning(""); 
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CartWarningAlert;
