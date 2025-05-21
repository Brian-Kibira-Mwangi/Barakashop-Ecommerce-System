"use client";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [jwt, setJwt] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(false);    
  const [cartWarning, setCartWarning] = useState("");       


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setJwt(token);
      try {
        const decoded = jwtDecode(token);
        console.log("🔑 JWT Decoded:", decoded);
        setUserId(decoded.id);
      } catch (error) {
        console.error("❌ Invalid JWT Token:", error);
        localStorage.removeItem("token");
      }
    } else {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      console.log("🛒 Cart from Local Storage:", storedCart);
      setCart(storedCart);
      setCartCount(storedCart.reduce((acc, item) => acc + item.quantity, 0));
    }
  }, []);

  useEffect(() => {
    if (jwt) {
      console.log("🔑 JWT Found, Fetching User Details...");
      fetchUserDetails();
    }
  }, [jwt]);

  useEffect(() => {
    if (jwt && username) {
      console.log("📦 Fetching Cart from Database for:", username);
      fetchCartFromDatabase(username).then((cartItems) => {
        setCart(cartItems);
        console.log("🛒 Cart Updated from DB:", cartItems);
      });
    }
  }, [username]); //  Runs only when `username` is set
  
   useEffect(() => {
    if (!jwt) {
      console.log("🛒 Saving Cart to Local Storage...");
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      console.log("✅ User is logged in, ensuring cart is fetched from DB.");
    }
    
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    console.log("🛒 Cart Updated:", cart);
  }, [cart, jwt]); //  Added `jwt` dependency to ensure it reacts to login state.
  

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get("http://localhost:1337/api/users/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
  
      if (response.status === 200) {
        //  Always update username
        setUsername(response.data.username);
        console.log("✅ User Found:", response.data.username);
      }
    } catch (error) {
      console.error("❌ Failed to Fetch User:", error);
    }
  };
  
  
  
  const syncLocalCartToDatabase = async (username, localCart) => {
    if (!localCart || localCart.length === 0) {
      console.log("⚠️ No items in local storage cart, skipping sync.");
      return; //  Prevent unnecessary sync
    }
  
    console.log("🔄 Syncing Local Storage Cart to DB...");
    
    for (const item of localCart) {
      await syncCartWithDatabase(username, item);
    }
  };

  const fetchCartFromDatabase = async (username) => {
    try {
        console.log("🛠 Fetching cart for username:", username);

        const response = await axios.get(
            `http://localhost:1337/api/cartDetails?filters[user][$eq]=${encodeURIComponent(username)}`,
            {
                headers: { Authorization: `Bearer ${jwt}` },
            }
        );

        if (response.status === 200) {
            console.log("🔍 API Response:", response.data);

            // Flatten the cart items while adding backendId
            const cartItems = response.data.flatMap((item) =>
                Array.isArray(item.cartDetails)
                    ? item.cartDetails.map((cartItem) => ({
                          ...cartItem,
                          selected: false,  // Ensure selected field is set
                          backendId: item.id, // Store backend cart ID
                      }))
                    : []
            );

            console.log("📦 Cart Items with backendId:", cartItems);
            return cartItems;
        }
        return [];
    } catch (error) {
        console.error("❌ Failed to Fetch Cart:", error);
        return [];
    }
};


const syncCartWithDatabase = async (username, item) => {
  console.log(`📡 Checking Inventory for Item: ${item.model}, ${item.color}, ${item.storage}`);

  try {
    //  Fetch inventory for the correct model
    const inventoryResponse = await axios.get(
      `http://localhost:1337/api/inventories?filters[Model_ID][Name][$eq]=${item.model}&filters[Color_name][Color_name][$eq]=${item.color}&filters[Storage][$eq]=${item.storage}`
    );

    if (inventoryResponse.status !== 200 || inventoryResponse.data.length === 0) {
      console.error("❌ Failed to fetch inventory data.");
      return;
    }

    const availableInventory = inventoryResponse.data.data.length;
    console.log(`📦 Inventory Available for ${item.model}: ${availableInventory}`);

    //  Fetch existing cart items only for this model
    const cartResponse = await axios.get(
      `http://localhost:1337/api/cartDetails?filters[user][$eq]=${username}&filters[cartDetails][model][$eq]=${item.model}&filters[cartDetails][color][$eq]=${item.color}&filters[cartDetails][storage][$eq]=${item.storage}`
    );

    const existingCartItems = cartResponse.data
      .flatMap(entry => entry.cartDetails)
      .filter(cartItem => 
        cartItem.model === item.model &&
        cartItem.color === item.color &&
        cartItem.storage === item.storage
      );

    //  Check if item already exists in DB
    const itemExistsInDB = existingCartItems.length > 0;

    if (itemExistsInDB) {
      console.warn(`⚠️ Item ${item.model} already exists in DB. Skipping addition.`);
      console.warn(`⚠️ Cannot add item to cart! Requested quantity exceeds available stock.`);
      const warningMessage = `⚠️  Some items you added to cart while logged out exceeded available stock and have been removed after syncing your cart upon login.`;
      localStorage.setItem("cartWarning", warningMessage);
      setCartWarning(warningMessage);
      return; // Prevent duplicate addition
    }

    const existingCartQuantity = existingCartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    console.log(`🛒 Existing Cart Quantity for ${item.model}: ${existingCartQuantity}`);

    // Ensure total quantity doesn’t exceed stock
    const totalQuantity = existingCartQuantity + item.quantity;    

    // Proceed with syncing to database
    console.log(`✅ Proceeding with Cart Sync: ${item.model}, Quantity: ${item.quantity}`);

    const response = await axios.post(
      "http://localhost:1337/api/cartDetails",
      {
        data: {
          user: username,
          cartDetails: [item],
        },
      },
      {
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log("✅ Item successfully added to DB!");
      
      const backendId = response.data.id;
      console.log(`✅ Synced to DB with Backend ID: ${backendId}`);

      // Update cart state
      setCart(prevCart => prevCart.map(cartItem =>
        cartItem.color === item.color && cartItem.model === item.model && cartItem.storage === item.storage
          ? { ...cartItem, backendId: backendId }
          : cartItem
      ));
    }
  } catch (error) {
    console.error("❌ Sync Error:", error);
  }
};

  const addToCart = (model, quantity, price, color, storage, image) => {
    const newItem = {
      id: Date.now(),
      model,
      quantity,
      price,
      color,
      storage,
      image,
      selected: false,
    };

    console.log("➕ Adding Item to Cart:", newItem);
    setCart((prevCart) => [...prevCart, newItem]);

    if (jwt && username) {
      syncCartWithDatabase(username, newItem);
    }
  };
  const removeFromCart = async (itemId) => {
    console.log(`🗑️ Attempting to delete item with Frontend ID: ${itemId}`);
    if(jwt){
      try {
        // Step 1: Fetch the full cart from backend
        const response = await axios.get("http://localhost:1337/api/cartDetails");

        if (response.status === 200) {
            const cartEntries = response.data; // Corrected: response.data is already an array

            if (!Array.isArray(cartEntries)) {
                console.error("❌ Unexpected API response format:", response.data);
                return;
            }

            // Step 2: Find the backend row that contains the frontend itemId
            let backendId = null;

            for (const entry of cartEntries) {
                if (Array.isArray(entry.cartDetails)) {
                    const matchingItem = entry.cartDetails.find((cartItem) => cartItem.id === itemId);
                    if (matchingItem) {
                        backendId = entry.id; // Store the backend ID of the entry
                        break;
                    }
                }
            }

            if (!backendId) {
                console.warn(`⚠️ No matching backend entry found for itemId: ${itemId}`);
                return;
            }

            console.log(`✅ Found Backend Row ID: ${backendId}. Deleting...`);
            console.log(`🗑️ Directly deleting item from PostgreSQL with Backend ID: ${backendId}`);

            try {
                const deleteResponse = await axios.post("http://localhost:1337/api/cartDetails/deleteDirectly", {
                    backendId,
                });

                if (deleteResponse.status === 200) {
                    console.log(`✅ Successfully deleted item with Backend ID: ${backendId}`);
                    setCart((prevCart) => prevCart.filter((item) => item.backendId !== backendId));
                } else {
                    console.error(`❌ Failed to delete item. Status: ${deleteResponse.status}`);
                }
            } catch (error) {
                console.error("❌ Error while deleting item:", error);
            }

            // Step 4: Update frontend cart state
            setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
        }
    } catch (error) {
        console.error("❌ Error fetching cart details:", error);
    }
    }else{
      console.log(`🛑 Removing Item from Local Storage: ${itemId}`);

      setCart((prevCart) => {
        const updatedCart = prevCart.filter((item) => item.id !== itemId);
        localStorage.setItem("cart", JSON.stringify(updatedCart)); // Save Updated Cart to Local Storage
        console.log("🛒 Updated Cart in Local Storage:", updatedCart);
        return updatedCart;
      });
    }
};
 // <-- Added missing closing bracket here
 
  const handleSelect = (itemId) => {
    console.log(`✅ Selecting Item ID: ${itemId}`);
    setCart(cart.map((item) => (item.id === itemId ? { ...item, selected: !item.selected } : item)));
  };

  const bulkDelete = async () => {
    setLoading(true);
    const selectedItems = cart.filter((item) => item.selected);

    console.log("🔥 Selected Items for Bulk Delete:", selectedItems);

    for (const item of selectedItems) {
      await removeFromCart(item.id, item.backendId);
    }

    console.log("🚮 Bulk Delete Completed");
    setLoading(false);
  };

  const completePayment = async () => {
    setLoading(true);
    const selectedItems = cart.filter((item) => item.selected);

    console.log("💳 Items for Payment:", selectedItems);

    for (const item of selectedItems) {
      await axios.put(
        `http://localhost:1337/api/cartDetails/${item.backendId}`,
        {
          data: { isPurchased: true },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log(`✅ Payment Complete for Item: ${item.model}`);
    }

    const updatedCart = await fetchCartFromDatabase(username);
    setCart(updatedCart);
    setLoading(false);
  };
  const clearCartAfterOrder = async (token) => {
    if (!token) {
      console.warn("⚠️ No authentication token found. Skipping cart deletion.");
      return;
    }
  
    try {
      // Step 1: Fetch all cart items from the backend
      const response = await axios.get("http://localhost:1337/api/cartDetails", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status !== 200 || !Array.isArray(response.data)) {
        console.error("❌ Unexpected cart API response:", response.data);
        return;
      }
  
      const cartEntries = response.data;
      const backendIds = [];
  
      // Step 2: Extract backend IDs of all items
      cartEntries.forEach((entry) => {
        if (Array.isArray(entry.cartDetails)) {
          entry.cartDetails.forEach(() => {
            backendIds.push(entry.id); // Store the parent cart entry ID
          });
        }
      });
  
      if (backendIds.length === 0) {
        console.warn("⚠️ No cart items found to delete.");
        return;
      }
  
      console.log(`🗑️ Deleting ${backendIds.length} items from PostgreSQL...`);
  
      // Step 3: Send delete request for each backend ID
      await Promise.all(
        backendIds.map(async (backendId) => {
          try {
            const deleteResponse = await axios.post(
              "http://localhost:1337/api/cartDetails/deleteDirectly",
              { backendId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
  
            if (deleteResponse.status === 200) {
              console.log(`✅ Successfully deleted item with Backend ID: ${backendId}`);
            } else {
              console.error(`❌ Failed to delete item. Status: ${deleteResponse.status}`);
            }
          } catch (error) {
            console.error(`❌ Error deleting item with Backend ID: ${backendId}`, error);
          }
        })
      );
  
      // Step 4: Clear frontend cart state
      setCart([]);
      console.log("🛒 Cart cleared from frontend state.");
    } catch (error) {
      console.error("❌ Error fetching cart details:", error);
    }
  };
  
  const resetCart = () => {
    setCart([]);
    setCartCount(0);
    console.log("🛒 Cart has been reset!");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        handleSelect,
        bulkDelete,
        completePayment,
        resetCart,
        fetchCartFromDatabase,
        syncLocalCartToDatabase,
        cartWarning, 
        setCartWarning,
        setUsername,
        loading,
        setCart,
        setJwt,
        clearCartAfterOrder,

      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
