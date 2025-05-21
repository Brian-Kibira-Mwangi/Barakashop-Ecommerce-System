"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function EnterOTP() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const router = useRouter();

  // Get the email from localStorage when the page loads
  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      setMessage("Error: No email found. Please try again.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true); // Set loading state

    console.log("🔹 Submitting OTP:", otp, "for email:", email); // Debugging

    try {
      const response = await axios.post("http://localhost:1337/api/verify-otp", {
        email,
        otp,
      });

      console.log("✅ OTP Verification Response:", response.data); // Log API response

      if (response.status === 200) {
        router.push("/enter-new-password"); // Redirect to reset password page
      }
    } catch (error) {
      console.error("❌ OTP Verification Failed:", error.response?.data || error.message);
      setMessage(error.response?.data?.error?.message || "Incorrect OTP. Please try again.");
    } finally {
      setLoading(false); // Stop loading state
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
        <h2 className="text-center text-xl font-semibold mb-4">Enter OTP</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-center text-sm text-gray-700 mb-2">
            Enter the OTP sent to <strong>{email}</strong>
          </p>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium">Enter OTP:</label>
            <input
              type="text"
              className="w-full p-2 rounded-md border"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)} // Auto-submit on Enter
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full bg-primary py-2 rounded-md mt-2 font-medium ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!otp.trim() || loading}  // Disable button while loading
          >
            {loading ? "Verifying..." : "Submit"}
          </Button>

          {/* Error Message */}
          {message && <p className="text-center text-sm text-red-500 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default EnterOTP;
