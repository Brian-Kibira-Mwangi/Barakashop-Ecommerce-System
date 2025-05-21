"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
     // Prevent invalid email submission

    setIsSendingOTP(true); // Show "Sending OTP..."
    setMessage("");

    try {
      const response = await axios.post("http://localhost:1337/api/send-otp", { email });

      if (response.status === 200) {
        localStorage.setItem("resetEmail", email);  // Save email for OTP verification
        router.push("/enter-otp");  // Redirect to OTP entry page
      }
    } catch (error) {
      setMessage("Failed to send OTP. Please try again.");
    }finally {
      setIsSendingOTP(false); // Reset button state
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen  bg-gray-100">
      <Link href="/" className="absolute top-4 left-4">
          <button className="text-gray-700 hover:text-gray-900 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-md border border-slate-300 transition-colors duration-200">
        Home
      </button>
          </Link>
      <div className="bg-slate-100 border p-6 rounded-lg shadow-md w-96">
        <h2 className="text-center text-xl font-semibold mb-4">Forgot Password</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Enter Email Address:</label>
            <input
              type="email"
              className="w-full border p-2 rounded-md"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
            />
          </div>

          <Button
            type="button"
            className="w-full bg-primary py-2 rounded-md mt-2 font-medium"
            disabled={!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) || isSendingOTP} // Disabled if empty or invalid email
            onClick={handleSubmit}
          >
            {isSendingOTP ? "Sending OTP..." : "Send OTP"}
</Button>

          {message && <p className="text-center text-sm text-gray-700 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
