import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <div className=" bg-white text-black ">
      {/* ===== Navigation ===== */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-lg font-semibold">
            <Image
              src="/assets/logo.png"
              alt="CredLend"
              width={30}
              height={30}
              priority
            />
            <span className="ml-2 text-sm md:text-lg">CredLend</span>
          </div>
          <div className="w-2 h-2 bg-[#14B9B5] rounded-full animate-[pulseGlow_2s_infinite]" />
        </div>
      </nav>
    </div>
  );
};

export default Logo;
