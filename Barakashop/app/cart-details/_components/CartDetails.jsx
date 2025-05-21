"use client";
import React from "react";
import { useState } from "react";
import { useCart } from "../../_context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { addZeyadaFont } from "../../logo/Zeyada-Regular-normal"; // Import properly

export default function CartDetails() {
  const { cart, removeFromCart, completePayment, clearCartAfterOrder } = useCart();
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [showPaypal, setShowPaypal] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState("");
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [showOutOfStockDialog, setShowOutOfStockDialog] = useState(false);
  const [outOfStockItemsAfterTransaction, setOutOfStockItemsAfterTransaction] = useState([]);
  const [showOutOfStockDialogAfterTransaction, setShowOutOfStockDialogAfterTransaction] = useState(false);
  const router = useRouter();
  const hasItems = cart.length > 0;

  // Simulated Authentication Token Check
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toggleSelect = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleDelete = () => {
    selectedItems.forEach((itemId) => removeFromCart(itemId));
    setSelectedItems([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };
  const validateCartBeforePayment = async (selectedPaymentMethod) => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to continue.");
        router.push("/sign-in");
        return;
    }

    try {
        let unavailableItems = [];
        let allItemsInStock = true; // Track if all items are available

        for (const item of cart) {
            console.log(`🔍 Checking inventory for ${item.model} (${item.color}, ${item.storage})...`);

            // Fetch inventory strictly using `Model_ID.Name`
            const inventoryResponse = await axios.get(
                `http://localhost:1337/api/inventories?filters[Model_ID][Name][$eq]=${encodeURIComponent(item.model)}&filters[Color_name][Color_name][$eq]=${encodeURIComponent(item.color)}&filters[Storage][$eq]=${encodeURIComponent(item.storage)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log(`📦 Raw API Response for ${item.model}:`, inventoryResponse.data);

            //  Ensure only correct models are filtered
            const matchedInventory = inventoryResponse.data.data.filter(
                (entry) => entry.Model_ID.Name === item.model
            );

            console.log(`✅ Filtered Inventory for ${item.model}:`, matchedInventory);

            //Get total available stock
            const availableStock = matchedInventory.length;
            console.log(`📦 Stock for ${item.model}: ${availableStock} left`);

            //If requested quantity > available stock, flag this item
            if (item.quantity > availableStock) {
                unavailableItems.push({
                    ...item,
                    availableStock, 
                    requestedQuantity: item.quantity // Track the requested quantity
                });
                allItemsInStock = false; // Not all items are in stock
            }
        }

        //If ANY item is out of stock, block payment
        if (!allItemsInStock) {
            console.warn("🚨 Some items are out of stock. Blocking payment.");
            setOutOfStockItems([...unavailableItems]); 
            setShowOutOfStockDialog(true);
            return; // STOP payment process
        }

        // Proceed with payment ONLY IF ALL items are available
        console.log("✅ All items are in stock. Proceeding to payment.");
        if (selectedPaymentMethod === "paypal") {
            setShowPaypal(true);
        } else if (selectedPaymentMethod === "mpesa") {
            setMpesaDialogOpen(true);
        }
    } catch (error) {
        console.error("❌ Error checking inventory:", error);
        alert("Error validating cart. Please try again.");
    }
};

const validateInventoryAfterPayment = async (cartItems) => {
  let availableItems = [];
  let unavailableItems = [];

  for (const item of cartItems) {
      try {
          const inventoryResponse = await axios.get(
              `http://localhost:1337/api/inventories?filters[Model_ID][Name][$eq]=${encodeURIComponent(item.model)}&filters[Color_name][Color_name][$eq]=${encodeURIComponent(item.color)}&filters[Storage][$eq]=${encodeURIComponent(item.storage)}`,
              { headers: { Authorization: `Bearer ${token}` } }
          );

          const matchedInventory = inventoryResponse.data.data.filter(
              (entry) => entry.Model_ID.Name === item.model
          );

          const availableStock = matchedInventory.length;
          if (availableStock > 0) {
            const fulfilledQuantity = Math.min(item.quantity, availableStock);
            
            availableItems.push({ ...item, quantity: fulfilledQuantity });
    
            if (fulfilledQuantity < item.quantity) {
              unavailableItems.push({ 
                ...item, 
                requestedQuantity: item.quantity, 
                availableStock: fulfilledQuantity 
              });
            }
          } else {
            unavailableItems.push({ 
              ...item, 
              requestedQuantity: item.quantity, 
              availableStock: 0 
            });
          }
      } catch (error) {
          console.error("❌ Error rechecking inventory:", error);
      }
  }

  return { availableItems, unavailableItems };
};

const notifyUserAboutUnavailableItems = (unavailableItems) => {
  setOutOfStockItemsAfterTransaction(unavailableItems);
  setShowOutOfStockDialogAfterTransaction(true);
};
  async function getExchangeRate() {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/KES");
      const data = await response.json();
      return data.rates.USD;
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      return 0.007; // Fallback static rate
    }
  }
  const formatPhoneNumber = (phone) => {
    // Remove any spaces or dashes
    phone = phone.replace(/\s|-/g, "");
  
    // Check if the number starts with "0", replace it with "254"
    if (phone.startsWith("0")) {
      return "254" + phone.substring(1);
    }
  
    // If it already starts with "254", return as is
    if (phone.startsWith("254")) {
      return phone;
    }
  
    // If it's an invalid format, return null
    return null;
  };
  
  const handleMpesaPayment = async () => {
    setMpesaDialogOpen(false);
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!phoneNumber) return;
  
    
    if (!formattedPhone) {
      setStatusMessage("❌ Invalid phone number. Please enter a valid Safaricom number.");
      setShowStatusDialog(true);
      return;
    }
  
    try {
      const response = await fetch("/api/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, amount: getTotalPrice() }),
      });
  
      const result = await response.json();
      if (result.ResponseCode === "0") {
        setStatusMessage("✅ M-Pesa STK push sent! Approve on your phone.");
        setShowStatusDialog(true);

        await createOrderDetails("mpesa");
      } else {
        setStatusMessage("❌ M-Pesa payment failed.");
        setShowStatusDialog(true);
      }
    } catch (error) {
      console.error("M-Pesa Error:", error);
      alert("Payment error. Try again.");
    }
  };
  const sendOrderEmail = async (orderId, status, availableItems, unavailableItems, totalPrice) => {
    console.log("Received totalPrice in sendOrderEmail:", totalPrice);
    try {
      const userResponse = await fetch("http://localhost:1337/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();
      const userEmail = userData.email;
  
      const emailPayload = {
        email: userEmail,
        orderId,
        status,
        items: availableItems,
        unavailableItems,
        totalPrice:getTotalPrice(),
      };
      
      console.log("Sending email payload:", emailPayload);
      await fetch("http://localhost:1337/api/sendOrderEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailPayload),
      });
  
      console.log("📧 Order email sent successfully!");
    } catch (error) {
      console.error("❌ Error sending order email:", error);
    }
  };
  

  const generateReceiptPDF = (orderId, items, totalPrice, username, paymentMethod) => {
    const doc = new jsPDF();
    
    addZeyadaFont(doc);
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20; // Margin from bottom for contact info
  
    // "Barakashop" in Zeyada Font (Teal Color)
    doc.setFont("Zeyada-Regular", "normal");
    doc.setFontSize(26);
    doc.setTextColor(0, 128, 128); // Teal color (RGB)
    doc.text("Barakashop", pageWidth / 2, 20, { align: "center" });
  
    // Reset to black for all other text
    doc.setTextColor(0, 0, 0); // Black color (RGB)
  
    // Order Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Order Receipt", pageWidth / 2, 35, { align: "center" });
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderId}`, 20, 50);
    doc.text(`Customer: ${username}`, 20, 60);
    doc.text(`Payment Method: ${paymentMethod}`, 20, 70);
  
    // Table Header
    let yPosition = 80;
    doc.setFont("helvetica", "bold");
    doc.text("Item", 20, yPosition);
    doc.text("Qty", 120, yPosition);
    doc.text("Price", 160, yPosition);
    doc.line(20, yPosition + 2, 190, yPosition + 2);
  
    // List Items
    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      yPosition += 10;
      doc.text(`${item.model} (${item.color}, ${item.storage})`, 20, yPosition);
      doc.text(`${item.quantity}`, 120, yPosition);
      doc.text(`Ksh ${item.price.toFixed(2)}`, 160, yPosition);
    });
  
    // Total Price
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: Ksh ${totalPrice.toFixed(2)}`, 20, yPosition);
  
    // Contact Information (centered at bottom)
    yPosition = pageHeight - marginBottom; // Position near bottom of page
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Contact us:", pageWidth / 2, yPosition - 15, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text("Phone: 0712345678", pageWidth / 2, yPosition - 5, { align: "center" });
    doc.text("Email: barakashop511@gmail.com", pageWidth / 2, yPosition, { align: "center" });
  
    // Download PDF
    doc.save(`OrderReceipt_${orderId}.pdf`);
};

  const createOrderDetails = async (paymentMethod) => {
    if (!token) {
      alert("You need to log in to place an order.");
      return;
    }
  
    // Generate a unique Order ID
    let orderId;
    let orderData;
    do {
      const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
      orderId = `ORD:${randomNum}`;
  
      // Check if orderId already exists
      const orderCheck = await fetch(`http://localhost:1337/api/orderhistories?filters[orderid][$eq]=${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      orderData = await orderCheck.json();
    } while (orderData?.data?.length > 0);
  
    // Fetch a random supplier
    const supplierResponse = await fetch("http://localhost:1337/api/suppliers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const suppliers = await supplierResponse.json();
    const randomSupplier =
      suppliers.data[Math.floor(Math.random() * suppliers.data.length)];
  
    // Get the logged-in username
    const userResponse = await fetch("http://localhost:1337/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userResponse.json();
    const username = userData.username;

    console.log("🔄 Rechecking inventory after payment...");
    const { availableItems, unavailableItems } = await validateInventoryAfterPayment(cart);

    if (availableItems.length === 0) {
        notifyUserAboutUnavailableItems(unavailableItems);
        await sendOrderEmail(orderId, "empty", [], unavailableItems, getTotalPrice());
        clearCartAfterOrder(token);
        return;
    }
  
    // Create order payload
    const orderPayload = {
      orderid: orderId,
      username,
      items: availableItems, // Store cart as JSON
      supplierdetails: JSON.stringify({
        name: randomSupplier.Name,
        phone: randomSupplier.phonenumber,
      }),
      paymentMethod,
    };
  
    // Save order in Strapi
    const orderResponse = await fetch("http://localhost:1337/api/orderhistories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: orderPayload }),
    });
  
    if (orderResponse.ok) {
      // Remove purchased items from inventory
      await deleteFromInventory(availableItems);

      completePayment();
      setStatusMessage("✅ Order placed successfully!");
      await fetchOrderHistory(orderId);
      await clearCartAfterOrder(token);
      if (unavailableItems.length === 0) {
        generateReceiptPDF(orderId, availableItems, getTotalPrice(), username, paymentMethod);
        await sendOrderEmail(orderId, "success", availableItems, [], getTotalPrice());
      }else{
        setOutOfStockItemsAfterTransaction(unavailableItems);
        setShowOutOfStockDialogAfterTransaction(true);
        await sendOrderEmail(orderId, "partial", availableItems, unavailableItems, getTotalPrice());
      }
    } else {
      setStatusMessage("❌ Failed to place order.");
    }
    setShowStatusDialog(true);
  };
  const fetchOrderHistory = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:1337/api/orderhistories?filters[orderid][$eq]=${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await response.json();
      if (data?.data?.length === 0) return;
  
      const orderDetails = data.data[0];
      console.log("✅ Order History Fetched:", orderDetails);
  
      // Process Inventory
      await queryInventory(orderDetails);
    } catch (error) {
      console.error("❌ Error fetching order history:", error);
    }
  };
  const queryInventory = async (orderDetails) => {
    const orderItems = orderDetails.items; 
    let fetchedItems = [];
  
    for (const item of orderItems) {
      const { model, storage, color, quantity } = item;
  
      try {
        const encodedStorage = storage.replace(/\s/g, '+'); // Replace spaces with '+'
  
        // Step 1: Fetch items by Model Name
        const modelResponse = await fetch(
          `http://localhost:1337/api/inventories?filters[Model_name][Name][$eq]=${model}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const modelData = await modelResponse.json();
  
        // Step 2: Fetch items by Color Name
        const colorResponse = await fetch(
          `http://localhost:1337/api/inventories?filters[Color_name][Color_name][$eq]=${color}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const colorData = await colorResponse.json();
  
        // Step 3: Fetch items by Storage
        const storageResponse = await fetch(
          `http://localhost:1337/api/inventories?filters[Storage][$eq]=${encodedStorage}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const storageData = await storageResponse.json();
  
        // Check if data exists
        if (!modelData?.data || !colorData?.data || !storageData?.data) {
          console.warn(`⚠️ No inventory data found for ${model}. Skipping.`);
          continue;
        }
  
        // Step 4: Find matching items
        const commonItems = findMatchingItems(
          modelData.data,
          colorData.data,
          storageData.data
        ).slice(0, quantity);
  
        if (commonItems.length > 0) {
          fetchedItems.push(...commonItems);
        }
      } catch (error) {
        console.error(`❌ Error querying inventory for ${model}:`, error);
      }
    }
  
    console.log("✅ Matched Inventory Items:", fetchedItems);
  
    if (fetchedItems.length > 0) {
      await pushToSalesTable(orderDetails, fetchedItems);
    }
  };

  // Function to find the common inventory items across the three queries
  function findMatchingItems(modelItems, colorItems, storageItems) {
    if (!Array.isArray(modelItems) || !Array.isArray(colorItems) || !Array.isArray(storageItems)) {
      console.warn("⚠️ One or more inventory lists are not valid arrays.");
      return [];
    }
  
    return modelItems.filter(
      (item) =>
        colorItems.some((cItem) => cItem.id === item.id) &&
        storageItems.some((sItem) => sItem.id === item.id)
    );
  }
  const pushToSalesTable = async (orderDetails, matchedItems) => {
    if (!token) {
      console.error("❌ No authentication token found.");
      return;
    }
  
    try {
      let successfullyAddedItems = [];
  
      for (const orderItem of orderDetails.items) {
        // Find inventory items that match this order item (same model, color, storage)
        const matchedForThisItem = matchedItems.filter(
          (item) =>
            item.Storage === orderItem.storage &&
            orderItem.color === orderItem.color
        );
  
        if (matchedForThisItem.length === 0) {
          console.warn(`⚠️ No inventory items found for ${orderItem.model}`);
          continue;
        }
  
        const totalPrice = orderItem.price; // Total price for this model
        const itemCount = orderItem.quantity; // How many were ordered
        const pricePerItem = itemCount > 0 ? totalPrice / itemCount : 0; // Per-unit price
  
        for (let i = 0; i < itemCount; i++) {
          if (matchedForThisItem[i]) {
            const item = matchedForThisItem[i];
  
            const salesPayload = {
              serialnumber: item.SerialNumber,
              model:orderItem.model,
              imei1: item.IMEI_1,
              imei2: item.IMEI_2,
              customer: orderDetails.username,
              supplier: orderDetails.supplierdetails,
              orderid: orderDetails.orderid,
              storage: item.Storage,
              color: orderItem.color,
              price: pricePerItem.toString(), // Per-unit price
            };
  
            const response = await fetch(`http://localhost:1337/api/sales`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ data: salesPayload }),
            });
            const responseData = await response.json();
            console.log("Sales API Response:", responseData);
  
            if (response.ok) {
              console.log(`✅ Added ${orderItem.model} (${item.SerialNumber}) at price ${pricePerItem}`);
              successfullyAddedItems.push(item);
            } else {
              console.error(`❌ Failed to add ${orderItem.model} (${item.SerialNumber}) to sales`);
            }
          }
        }
      }
  
      if (successfullyAddedItems.length > 0) {
        await deleteFromInventory(successfullyAddedItems);
      } else {
        console.warn("⚠️ No items were added to sales, skipping inventory deletion.");
      }
    } catch (error) {
      console.error("❌ Error pushing items to sales table:", error);
    }
  };

  const deleteFromInventory = async (matchedItems) => {
    if (!token) {
      console.error("❌ No authentication token found.");
      return;
    }
  
    try {
      // Extract IDs of items to delete
      const itemIdsToDelete = matchedItems.map((item) => item.id);
  
      // Log extracted item IDs
      console.log("🗑️ Extracted Inventory Item IDs to be deleted:", itemIdsToDelete);
  
      if (itemIdsToDelete.length === 0) {
        console.warn("⚠️ No items to delete.");
        return;
      }
  
      // Send request to backend to delete items
      const response = await fetch("http://localhost:1337/api/inventories/deleteInventoryItems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds: itemIdsToDelete }),
      });

  
      if (response.ok) {
        console.log("✅ Items deleted from inventory successfully.");
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to delete items from inventory. Response:", errorText);
      }
    } catch (error) {
      console.error("❌ Error deleting items from inventory:", error);
    }
  };
  
  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="p-4 relative">
        {/* Cart Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-600 text-2xl font-bold">Cart Details</h2>

          {hasItems &&
            (token ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-green-600 text-white px-6 py-2 rounded-md">
                    Make Payment
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      validateCartBeforePayment("paypal")
                    }}
                  >
                    Pay with PayPal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => validateCartBeforePayment("mpesa")}>
                    Pay with M-Pesa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="bg-green-600 text-white px-6 py-2 rounded-md"
                onClick={() => router.push("/sign-in")}
              >
                Make Payment
              </Button>
            ))}
        </div>
        {/* M-Pesa Payment Dialog */}
        <Dialog open={mpesaDialogOpen} onOpenChange={setMpesaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter M-Pesa Phone Number</DialogTitle>
            </DialogHeader>
            <Input
              type="tel"
              placeholder="e.g., 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={handleMpesaPayment}>Proceed</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Message Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{statusMessage}</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowStatusDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cart Items */}
        <div className="max-h-[24.5rem] overflow-y-auto">
          {hasItems ? (
            cart.map((item, index) => (
              <div key={index} className="border-b py-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <span>{index + 1}</span>
                  <span>
                    {item.model} ({item.storage})
                  </span>
                  <img
                    src={item.image}
                    alt={item.model}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <div className="flex items-center gap-2">
                    {item.color && (
                      <span className="bg-gray-200 px-2 py-1 rounded">{item.color}</span>
                    )}
                    <span>x{item.quantity}</span>
                    <span className="">Ksh {item.price}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-6 h-6"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No items in cart</p>
          )}
        </div>

        {/* Bottom Buttons */}
        {hasItems && (
          <div className="mt-4 flex justify-between">
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={selectedItems.length === 0}
            >
              <Trash2 size={18} /> Delete Selected
            </Button>
            <p className="font-bold text-lg">Total: Ksh {getTotalPrice()}</p>
          </div>
        )}
         {/* Popup for unavailable items */}
         {/* Out-of-Stock Popup */}
         <Dialog open={showOutOfStockDialog} onOpenChange={setShowOutOfStockDialog}>
          <DialogContent>
            <DialogHeader>
              {/* Dynamically set singular/plural for title */}
                <DialogTitle>
                  ⚠️ {outOfStockItems.length > 1 || (outOfStockItems.length === 1 && outOfStockItems[0].requestedQuantity > 1) 
                      ? "Items Out of Stock" 
                      : "Item Out of Stock"}
                </DialogTitle>
            </DialogHeader>

        {/* Ensure `outOfStockItems` exists and has at least one item before rendering */}
        {outOfStockItems && outOfStockItems.length > 0 ? (
            <>
                <p>
                    The following {outOfStockItems.length > 1 || (outOfStockItems.length === 1 && outOfStockItems[0].requestedQuantity > 1) 
                        ? "items are" 
                        : "item is"} no longer available in stock:
                </p>
                <ul className="list-disc ml-4">
                    {outOfStockItems.map((item) => (
                        <li key={item.id}>
                            {item.model} ({item.color}, {item.storage}) 
                            - <strong>Requested:</strong> {item.requestedQuantity}, 
                            <strong> Available:</strong> {item.availableStock}
                        </li>
                    ))}
                </ul>
            </>
        ) : (
            <p>No out-of-stock items found.</p> // Fallback in case the array is empty
        )}

        <p>
            Please remove {outOfStockItems.length > 1 || (outOfStockItems.length === 1 && outOfStockItems[0].requestedQuantity > 1) 
                ? "them" 
                : "it"} to proceed.
        </p>
    </DialogContent>
         </Dialog>

         <Dialog open={showOutOfStockDialogAfterTransaction} onOpenChange={setShowOutOfStockDialogAfterTransaction}> 
    <DialogContent>
        <DialogHeader>
            <DialogTitle>
                ⚠️ {outOfStockItemsAfterTransaction.some(item => (item.requestedQuantity - item.availableStock) > 1) 
                    || outOfStockItemsAfterTransaction.length > 1 
                    ? "The Following Items Are Out of Stock After Payment" 
                    : "The Following Item Is Out of Stock After Payment"}
            </DialogTitle>
        </DialogHeader>

        {outOfStockItemsAfterTransaction.length > 0 ? (
            <>
                <p>
                    {outOfStockItemsAfterTransaction.some(item => (item.requestedQuantity - item.availableStock) > 1) 
                        || outOfStockItemsAfterTransaction.length > 1 
                        ? "The following items are no longer available after your payment:" 
                        : "The following item is no longer available after your payment:"}
                </p>
                <ul className="list-disc ml-4">
                    {outOfStockItemsAfterTransaction.map((item) => {
                        const shortage = item.requestedQuantity - item.availableStock;
                        return (
                            <li key={item.id}>
                                {item.model} ({item.color}, {item.storage}) 
                                - <strong>Ordered:</strong> {item.requestedQuantity}, 
                                <strong> Available Now:</strong> {item.availableStock} 
                                
                            </li>
                        );
                    })}
                </ul>
                <p>
                    Please contact customer support for further assistance.
                </p>
            </>
        ) : (
            <p>No out-of-stock items found.</p>
        )}
    </DialogContent>
</Dialog>

        {/* PayPal Modal */}
        {showPaypal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Complete Payment</h3>
                <Button onClick={() => setShowPaypal(false)} variant="outline">
                  X
                </Button>
              </div>
              <PayPalButtons
                createOrder={async (data, actions) => {
                  const rate = await getExchangeRate();
                  const usdValue = (getTotalPrice() * rate).toFixed(2);

                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          currency_code: "USD",
                          value: usdValue,
                        },
                      },
                    ],
                  });
                }}
                onApprove={async (data, actions) => {
                  const order = await actions.order.capture();
                  console.log("✅ Payment Successful:", order);

                  await createOrderDetails("paypal");
                  completePayment();
                  setShowPaypal(false);
                }}
                onCancel={() => {
                  console.log("❌ Payment Cancelled");
                  setShowPaypal(false);
                }}
                onError={(err) => {
                  console.error("❌ Payment Error:", err);
                  setShowPaypal(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  );
}
