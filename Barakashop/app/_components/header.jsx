"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, CircleUserRound, LayoutGrid, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "../_context/CartContext";
import GlobalApi from "../_utils/GlobalApi";
import ProfileDetails from "./ProfileDetails"; // Profile Sidebar
import { Zeyada } from "next/font/google";
import { Patrick_Hand } from "next/font/google";
import { Gloria_Hallelujah } from "next/font/google";
const zeyada = Zeyada({ weight: "400", subsets: ["latin"] });
const patrickHand = Patrick_Hand({ weight: "400", subsets: ["latin"] });
const gloria = Gloria_Hallelujah({ weight: "400", subsets: ["latin"] });

function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { cartCount, resetCart, setJwt} = useCart();
  const [categoryList, setCategoryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  

  useEffect(() => {
    checkUserSession();
    getCategoryList();

    const handleStorageChange = () => checkUserSession();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  

  const checkUserSession = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const user = await GlobalApi.getProfile(token);
      setIsLoggedIn(true);
      setIsAdmin(user.role === "admin");
    }
  };

  const getCategoryList = () => {
    GlobalApi.getCategory().then((resp) => {
      setCategoryList(resp.data.data);
    });
  };

  const handleLogout = () => {
    console.log("🚪 Logging Out: Clearing Token and Cart...");
   
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setJwt(null);
    resetCart();
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("storage"));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      router.push(`/product-search/${searchQuery.trim()}`);
    }
  };
  const handleSignInRedirect = () => {
    localStorage.setItem("prevPage", window.location.pathname); // Store current page
    router.push("/sign-in"); // Navigate to sign-in page
  };
  

  return (
    <>
      <div className="p-5 shadow-sm flex justify-between items-center">
        <div className="flex gap-8 items-center">
          <Link href="/" className={`${zeyada.className} text-4xl text-teal-600`}>Barakashop</Link>

          {/* Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="hidden md:flex gap-2 items-center border rounded-full p-2 px-10 bg-slate-200 cursor-pointer">
                <LayoutGrid className="h-5 w-5" /> Category
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[8.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {categoryList.map((category, index) => (
                <Link key={index} href={"/products-category/" + category.Brand}>
                  <DropdownMenuItem>{category.Brand}</DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="md:flex gap-3 items-center border rounded-full p-2 px-5 hidden"
          >
            <Search className="cursor-pointer" onClick={handleSearch} />
            <input
              type="text"
              placeholder="Search"
              className="outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex gap-5 items-center">
          {!isAdmin && (
            <Link href="/cart-details">
              <div className="relative">
                <ShoppingBag className="cursor-pointer text-green-600 w-8 h-8" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-sm w-5 h-5 flex items-center justify-center">
                  {cartCount || 0}
                </span>
              </div>
            </Link>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <CircleUserRound className="h-12 w-12 bg-green-100 text-primary p-2 rounded-full cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  Profile
                </DropdownMenuItem>
                <Link href="/orderhistory">
                  <DropdownMenuItem>View Orders</DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
              <Button onClick={handleSignInRedirect}>Login</Button>
          )}
        </div>
      </div>

      {/* Profile Sidebar */}
      <ProfileDetails isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}

export default Header;
