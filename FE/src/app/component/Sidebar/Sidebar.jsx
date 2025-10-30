"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const links = [
    { 
      href: "/home", 
      label: "Home", 
      icon: <img src="/assets/homepage.png" alt="Home" width={20} height={20} />
    },
    { 
      href: "/wallet", 
      label: "Wallet", 
      icon: <img src="/assets/wallet.png" alt="Wallet" width={20} height={20} />
    },
    { 
      href: "/loan", 
      label: "Loan", 
      icon: <img src="/assets/borrow.png" alt="Borrow" width={20} height={20} />
    },
    { 
      href: "/kyc", 
      label: "KYC", 
      icon: <img src="/assets/kyc.png" alt="KYC" width={20} height={20} />
    },
  ];

  return (
    <div className="h-full bg-white border-r border-gray-200">
      <div className="p-4">
        <h1 className="text-lg font-semibold mb-6 px-2 text-black hidden md:block">Menu</h1>
        <nav className="flex flex-col gap-2">
          {links.map(({ href, label, icon }) => (
            <div key={href} className="relative group">
              <Link
                href={href}
                className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-3 rounded-lg text-sm font-medium transition ${
                  pathname === href
                    ? "bg-[#E6FAF1] text-[#059669]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onMouseEnter={() => setActiveTooltip(href)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                {icon}
                <span className="hidden md:inline">{label}</span>
              </Link>
              
              {/* Tooltip for mobile */}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none md:hidden z-10">
                {label}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}