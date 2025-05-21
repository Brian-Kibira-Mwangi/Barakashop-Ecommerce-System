"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token")?.trim() : null;

    if (!token) {
      console.warn("⚠️ No authentication token found. Redirecting...");
      router.push("/"); // Redirect immediately
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      console.log("Decoded Token:", decoded);

      axios
        .get(`http://localhost:1337/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const username = res.data.username;
          console.log("✅ Username Retrieved:", username);

          if (username) {
            axios
              .get(`http://localhost:1337/api/orderhistories?filters[username][$eq]=${username}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((response) => {
                console.log("✅ Full API Response:", response.data);
                const orderData = response.data?.data || [];

                const groupedOrders = orderData.reduce((acc, order) => {
                  const { orderid, items = [], supplierdetails, status, isdelivered } = order;

                  if (!acc[orderid]) {
                    acc[orderid] = {
                      orderid,
                      supplierdetails,
                      status,
                      isdelivered,
                      items: [],
                    };
                  }

                  acc[orderid].items.push(...items);
                  return acc;
                }, {});

                console.log("📦 Grouped Orders:", Object.values(groupedOrders));
                setOrders(Object.values(groupedOrders));
              })
              .catch((err) => {
                console.error("❌ Error fetching order history:", err.response ? err.response.data : err);
              });
          } else {
            console.warn("⚠️ No username found in response.");
          }
        })
        .catch((err) => {
          console.error("❌ Error fetching user details:", err.response ? err.response.data : err);
          router.replace("/"); // Redirect if API fails
        });
    } catch (error) {
      console.error("❌ Error decoding JWT token:", error);
      router.replace("/"); // Redirect if token is invalid
    }
  }, [router]);

  if (orders.length === 0) {
    return <p className="text-gray-600">No orders found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-100 shadow-md rounded-md mt-[3rem]">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 bg-gray-800 text-white p-2 rounded">
        Your Orders
      </h2>

      <div className="space-y-4 max-h-[25rem] overflow-y-auto">
        {orders.map((order) => (
          <div key={order.orderid} className="bg-white p-4 rounded-md shadow-md border">
            <p className="text-sm text-gray-500 font-medium mb-2">{order.orderid}</p>

            {order.items.map((item, index) => {
              const imageUrl = item.image || "/placeholder.png";

              return (
                <div key={index} className="grid grid-cols-6 items-center gap-4 bg-gray-50 p-3 rounded-md border-b">
                  <img src={imageUrl} alt={item.model} className="w-16 h-16 object-cover rounded-md" />
                  <p className="text-gray-800 font-medium">{item.model}</p>
                  <p className="px-2 py-1 bg-gray-200 rounded text-sm">{item.color}</p>
                  <p className="text-gray-700">x{item.quantity}</p>
                  <p className="text-gray-600">{item.storage}</p>
                  <p className="text-gray-900 font-semibold">Ksh {item.price}</p>
                </div>
              );
            })}

            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-600">
                Supplier: {order.supplierdetails?.name}, {order.supplierdetails?.phone}
              </p>
              <button className={`px-3 py-1 rounded-md ${order.isdelivered ? 'bg-[#dbeafe] text-gray-900' : 'bg-gray-300 text-gray-700'}`}>
                {order.isdelivered ? "Delivered" : "Not Delivered"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
