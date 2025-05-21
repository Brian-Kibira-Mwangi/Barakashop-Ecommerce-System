"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/app/_context/CartContext";
import { Button } from "@/components/ui/button";

function SignIn() {
  const { fetchCartFromDatabase, syncLocalCartToDatabase, setUsername, setCart, setJwt, cartWarning, setCartWarning} = useCart(); 
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/"); // Redirect if already logged in
      }
    }
  }, [isClient, router]);

  useEffect(() => {
    //Save the last visited page before login
    if (document.referrer) {
      sessionStorage.setItem("prevPage", document.referrer);
    }
  }, []);
  useEffect(() => {
    if (document.referrer) {
      sessionStorage.setItem("prevPage", document.referrer);
    }
  }, []);  

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch("http://localhost:1337/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.email,
          password: formData.password,
        }),
      });

      let data = await response.json();

      if (!response.ok || !data.jwt) {
        throw new Error(data?.error?.message || "Something went wrong. Please try again.");
      }

      console.log("✅ User logged in:", data.user.username);

      //Save token & user info in local storage
      localStorage.setItem("token", data.jwt);
      localStorage.setItem("user", JSON.stringify(data.user));

      //Update token in Cart Context
      setJwt(data.jwt);
      setUsername(data.user.username);

      //Ensure token exists before proceeding
      if (!data.jwt) {
        console.error("❌ Token is missing after login. Cannot sync cart.");
        return;
      }

      //Check if local storage cart has items
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (localCart.length > 0) {
        console.log("🔄 Syncing Local Cart to Database on Login...");
        await syncLocalCartToDatabase(data.user.username, localCart);

        //Clear local storage cart AFTER successful sync
        localStorage.removeItem("cart");

        //Verify if local storage cart is actually cleared
        if (!localStorage.getItem("cart")) {
          console.log("✅ Local storage cart successfully cleared!");
        } else {
          console.warn("⚠️ Local storage cart still exists!");
        }
      } else {
        console.log("⚠️ No items found in local storage, skipping sync.");
      }

      //Fetch updated cart from DB and update Cart Context
      const updatedCart = await fetchCartFromDatabase(data.user.username);
      setCart(updatedCart);
      console.log("📦 Updated cart fetched from DB:", updatedCart);
      const prevPage = localStorage.getItem("prevPage") || "/"; // Default to home if no prevPage
      router.push(prevPage); // Otherwise, go back to the previous page
      localStorage.removeItem("prevPage");
      if (cartWarning) {
        setCartWarning(cartWarning);
        localStorage.setItem("cartWarning", cartWarning);
      }
    } catch (err) {
      console.error("❌ Unexpected Error:", err.message);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoggingIn(false); //Re-enable button after request completes
    }
};

  //Prevent rendering during SSR (Fix Hydration Error)
  if (!isClient) {
    return <div className="bg-gray-100 min-h-screen"></div>;
  }


return (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 antialiased">
    <Link href="/" className="absolute top-4 left-4">
    <button className="text-gray-700 hover:text-gray-900 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-md border border-slate-300 transition-colors duration-200">
  Home
</button>
    </Link>
    <div className="bg-slate-100 p-6 rounded-lg shadow-md w-96 border relative">
      {/* Home Button */}

      <h2 className="text-center text-xl font-semibold mb-4">Login</h2>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

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

        {/* Password */}
        <div>
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

        {/* Forgot Password Link */}
        <p className="text-center text-sm flex justify-end">
          <a href="/forgot-password" className="underline text-gray-600">Forgot password?</a>
        </p>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full py-2 rounded-md mt-2 font-medium"
          disabled={!formData.email || !formData.password || isLoggingIn}
        >
          {isLoggingIn ? "Logging in..." : "Login"}
        </Button>

        {/* Register Link */}
        <p className="text-center text-sm mt-2">
          <Link href="/create-account" className="underline text-gray-600">Register</Link>
        </p>
      </form>
    </div>
  </div>
);
}

export default SignIn;
