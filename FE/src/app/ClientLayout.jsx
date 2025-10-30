"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./component/Sidebar/Sidebar";
import Navbar from "./component/Navbar/Navbar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Hide layout for these pages
  const hideLayout = ["/", "/login", "/signup", "/profile"].includes(pathname);

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Navbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex-shrink-0">
          <Navbar />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
