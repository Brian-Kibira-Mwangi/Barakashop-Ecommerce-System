"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function EnterNewPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:1337/api/reset-password", {
        email,  // Send email with password reset request
        password: newPassword,
      });

      if (response.status === 200) {
        setMessage("Password updated successfully!");
        localStorage.removeItem("resetEmail"); 
        
        router.push("/sign-in");
      }
    } catch (error) {
      setMessage("Failed to reset password. Try again.");
    }finally {
      setLoading(false); // Ensure loading is reset after request
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen  bg-gray-100">
      <Link href="/" className="absolute top-4 left-4">
    <button className="text-gray-700 hover:text-gray-900 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-md border border-slate-300 transition-colors duration-200">
  Home
</button>
    </Link>
      <div className="bg-slate-100 border p-6 rounded-lg shadow-md w-[500px]">
        <h2 className="text-center text-xl font-semibold mb-4">Reset Password</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email Display */}
          <p className="text-center text-sm text-gray-700 mb-2">Resetting password for: <strong>{email}</strong></p>

          {/* Password Fields */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium">New Password:</label>
              <input
                type="password"
                className="w-full border p-2 rounded-md"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium">Confirm Password:</label>
              <input
                type="password"
                className="w-full border p-2 rounded-md"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              className="w-full bg-primary py-2 px-6 rounded-md mt-2 font-medium"
              disabled={!newPassword.trim() || !confirmPassword.trim() || newPassword !== confirmPassword || loading} 
            >
              {loading ? "Changing Password..." : "Submit"}
            </Button>

          </div>

          {/* Message Display */}
          {message && <p className="text-center text-sm text-gray-700 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default EnterNewPassword;
