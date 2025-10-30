"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Meta from "../component/Meta/Meta";
import ActiveLoans from "../component/ActiveLoans/ActiveLoans";
import TransactionHistory from "../component/TransactionHistory/TransactionHistory";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      //  No token, redirect to login
      router.push("/login");
    } else {
      //  Token exists, allow access
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
      </div>
    );
  }

  if (!isAuthenticated) return null; // Avoid flicker before redirect

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100 ">
      <Meta />
      <ActiveLoans />
      <TransactionHistory />
    </div>
  );
}
