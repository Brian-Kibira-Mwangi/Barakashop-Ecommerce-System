"use client";

import { Outfit } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Header from "./_components/header";
import { CartProvider } from "./_context/CartContext";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider
import CartWarningAlert from "./_components/CartWarningAlert";
const outfit = Outfit({ subsets: ["latin"] }); // Default font
const geist = Geist_Mono({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const hideHeaderOnPaths = [
    "/sign-in",
    "/create-account",
    "/forgot-password",
    "/enter-new-password",
    "/enter-otp",
  ];

  const excludeCartOnPaths = ["/order-history"];

  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        <SessionProvider>
          {excludeCartOnPaths.includes(pathname) ? (
            children
          ) : (
            <CartProvider>
              <CartWarningAlert />
              {!hideHeaderOnPaths.includes(pathname) && <Header />}
              {children}
            </CartProvider>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}

