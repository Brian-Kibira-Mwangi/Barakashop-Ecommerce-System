"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { Button } from "@/components/ui/button";
import Link from "next/link";
function CreateAccount() {
  const router = useRouter(); // Initialize the router
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);


  // Check for an existing session on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/"); // Redirect if already logged in
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      // Step 1: Register the User
      const registerResponse = await fetch("http://localhost:1337/api/auth/local/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const registerData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(registerData?.error?.message || "Registration failed");

      const jwtToken = registerData.jwt; // Authentication token

      if (!jwtToken) throw new Error("Invalid registration response");

      console.log("User registered successfully:", registerData.user);

      // Step 2: Create the Customer Record with the Username as a String
      const customerResponse = await fetch("http://localhost:1337/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`, // Authenticate request
        },
        body: JSON.stringify({
          data: {
            Firstname: formData.firstName,
            Lastname: formData.lastName,
            Phonenumber: formData.phoneNumber,
            User: formData.username, // Store username as a string
          },
        }),
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        console.error("Customer creation error:", customerData);
        throw new Error(customerData?.error?.message || "Failed to create customer");
      }

      console.log("Customer record created successfully:", customerData);

      setSuccess("Account created successfully!");
      setError(null);

      // Redirect user to sign-in page
      router.push("/sign-in");
    } catch (err) {
      console.error("Error during registration:", err);
      setError(err.message);
      setSuccess(null);
    }finally {
      setIsRegistering(false); // Reset button state
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen  bg-gray-100">
      <Link href="/" className="absolute top-4 left-4">
    <button className="text-gray-700 hover:text-gray-900 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-md border border-slate-300 transition-colors duration-200">
  Home
</button>
    </Link>
      <div className="bg-slate-100 p-6 rounded-lg shadow-md w-96 border">
        <h2 className="text-center text-xl font-semibold mb-4">Register</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email:</label>
            <input
              type="email"
              name="email"
              className="w-full border p-2 rounded-md"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* First Name & Last Name */}
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium">First Name:</label>
              <input
                type="text"
                name="firstName"
                className="w-full border p-2 rounded-md"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">Last Name:</label>
              <input
                type="text"
                name="lastName"
                className="w-full border p-2 rounded-md"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium">Username:</label>
            <input
              type="text"
              name="username"
              className="w-full border p-2 rounded-md"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium">Password:</label>
              <input
                type="password"
                name="password"
                className="w-full border p-2 rounded-md"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full border p-2 rounded-md"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium">Phone Number:</label>
            <input
              type="tel"
              name="phoneNumber"
              className="w-full border p-2 rounded-md"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            className="w-full py-2 rounded-md mt-2 font-medium"
            disabled={
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword ||
              !formData.firstName ||
              !formData.lastName ||
              !formData.username ||
              !formData.phoneNumber ||
              isRegistering
            }
          >
            {isRegistering ? "Registering..." : "Register"}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm mt-2">
            <a href="/sign-in" className="underline text-gray-600">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default CreateAccount;
