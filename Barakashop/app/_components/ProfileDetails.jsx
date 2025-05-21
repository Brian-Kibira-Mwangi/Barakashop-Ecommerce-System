"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { CircleUserRound } from "lucide-react";

function ProfileDetails({ isOpen, onClose }) {
  const [userDetails, setUserDetails] = useState({
    id: null, // Store customer ID
    firstName: "Loading...",
    lastName: "Loading...",
    email: "Loading...",
    phoneNumber: "Loading...",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchUserDetails();
    }
  }, [isOpen]);

  //  Fetch user details
  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user may not be authenticated.");
        return;
      }

      console.log("Fetching user details...");

      //  1. Get authenticated user
      const userResponse = await axios.get("http://localhost:1337/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.data) {
        console.error("User data not found in response.");
        return;
      }

      const { username, email } = userResponse.data;
      console.log("User found:", username, email);

      // 2. Fetch customer details using username
      const customerResponse = await axios.get(
        `http://localhost:1337/api/customers?filters[User][$eq]=${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!customerResponse.data || customerResponse.data.data.length === 0) {
        console.warn("No customer details found for user:", username);
        return;
      }

      const customerData = customerResponse.data.data?.[0] || {}; // Ensure correct structure

      console.log("Extracted Customer Attributes:", customerData);

      // Store user and customer details
      setUserDetails({
        id: customerData.id, // Store the customer ID
        username: customerData.User,
        firstName: customerData.Firstname || "N/A",
        lastName: customerData.Lastname || "N/A",
        email: email || "N/A",
        phoneNumber: customerData.Phonenumber || "N/A",
      });

      console.log("User details updated successfully.");
    } catch (error) {
      console.error("Error fetching user details:", error.response?.data || error.message);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✨ Handle Submit Updated Info
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user may not be authenticated.");
        return;
      }
  
      // 🔹 Get new email from form input
      const newEmail = formData.email || userDetails.email;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newEmail)) {
      alert("⚠️ Invalid email format. Please enter a valid email address.");
      return; 
    }
  
      console.log("🔄 Checking if email exists:", newEmail);
  
      // Step 1: Check if email exists for another user
      const emailCheckResponse = await fetch(
        `http://localhost:1337/api/users?filters[email][$eq]=${newEmail}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const emailCheckData = await emailCheckResponse.json();
      console.log("🔍 Email check response:", emailCheckData);
  
      if (emailCheckData.length > 0) {
        // If email exists and is not the current user, show error
        const existingUser = emailCheckData.find(
          (user) => user.username !== userDetails.username
        );
  
        if (existingUser) {
          alert("⚠️ Email already exists. Try a new one.");
          return; // Stop the update
        }
      }
  
      // Step 2: Prepare customer update payload
      const customerPayload = {
        user: userDetails.username,
        firstname: formData.firstName || userDetails.firstName,
        lastname: formData.lastName || userDetails.lastName,
        phonenumber: formData.phoneNumber || userDetails.phoneNumber,
        email: newEmail,
      };
  
      console.log("📤 Submitting updated customer details:", customerPayload);
  
      // Step 3: Send request to update customer details
      const customerResponse = await fetch(
        "http://localhost:1337/api/customers/update-details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(customerPayload),
        }
      );
  
      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerData?.error?.message || "Failed to update customer details.");
      }
  
      console.log("✅ Customer details updated successfully:", customerData);
  
      // Step 4: Refresh user details
      fetchUserDetails();
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Error updating user details:", error.message);
    }
  };
  
    
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" />}

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? "0%" : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg p-6 z-50"
      >
        <button onClick={onClose} className="absolute top-2 left-2 text-sm">
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center my-4">
        <CircleUserRound className="h-12 w-12 bg-green-100 text-primary p-2 rounded-full" />
        </div>

        {/* User Info - Switches between labels and input fields */}
        <div className="space-y-3">
          {["firstName", "lastName", "email", "phoneNumber"].map((field) => (
            <div key={field}>
              <p className="text-gray-500 text-sm capitalize">{field.replace(/([A-Z])/g, " $1")}</p>
              {isEditing ? (
                <input
                  type="text"
                  name={field}
                  value={formData[field] !== undefined ? formData[field] : userDetails[field] || ""}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border rounded"
                />
              ) : (
                <p className="font-medium">{userDetails[field]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-4">
          {isEditing ? (
            <button
              onClick={handleSubmit}
              className="w-full bg-primary text-white py-2 rounded"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-primary py-2 rounded  text-white"
            >
              Edit details
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

export default ProfileDetails;
