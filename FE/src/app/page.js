"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiTwitter, FiGithub, FiMenu, FiX } from "react-icons/fi";
import { FaDiscord, FaTelegram } from "react-icons/fa";

export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Animated Sign-Up Button
  const AnimatedSignupButton = ({ text = "Sign up for free" }) => {
    const [hovered, setHovered] = useState(false);
    const [sweeping, setSweeping] = useState(null);

    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => {
          setHovered(true);
          setSweeping("forward");
        }}
        onMouseLeave={() => {
          setHovered(false);
          setSweeping("backward");
        }}
      >
        {/* Background Sweep */}
        <AnimatePresence>
          {sweeping && (
            <motion.span
              key={sweeping}
              initial={{ x: sweeping === "forward" ? "-100%" : "100%" }}
              animate={{ x: "0%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              onAnimationComplete={() => setSweeping(null)}
              className={`absolute inset-0 rounded-lg -z-10 ${sweeping === "forward" ? "bg-white" : "bg-[#14B9B5]"
                } overflow-hidden`}
            >
              {/* Moving Ball */}
              <motion.span
                initial={{
                  x: sweeping === "forward" ? "-10%" : "110%",
                }}
                animate={{
                  x: sweeping === "forward" ? "110%" : "-10%",
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow ${sweeping === "forward" ? "bg-[#14B9B5]" : "bg-white"
                  }`}
              />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Button Content */}
        <button
          onClick={() => router.push("/signup")}
          className={`relative overflow-hidden px-6 py-3 md:px-8 md:py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 border border-[#14B9B5]
            ${hovered ? "text-[#14B9B5] bg-white" : "text-white bg-[#14B9B5]"}`}
        >
          {text}
          <AnimatePresence>
            {hovered && (
              <motion.span
                key="hover-dot"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: 100,
                  transition: { duration: 0.6 },
                }}
                transition={{ duration: 0.25 }}
                className="w-3 h-3 rounded-full bg-[#14B9B5]"
              />
            )}
          </AnimatePresence>
        </button>
      </div>
    );
  };

  // ✅ Animated Image Boxes Component
  const AnimatedImageBoxes = () => {
    const [currentImage, setCurrentImage] = useState(0);
    const images = [
      "/assets/movable.png",
      "/assets/movable2.png",
      "/assets/movable3.png",
      "/assets/movable2.png"
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }, [images.length]);

    return (
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 mb-12">
        {/* Left Box */}
        <div className="relative group">
          <div className="w-64 h-64 md:w-120 md:h-120 bg-gray-100 rounded-2xl overflow-hidden shadow-lg relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[currentImage]}
                  alt="CredLend Feature"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#14B9B5] rounded-2xl transition-all duration-300 pointer-events-none" />
        </div>

        {/* Right Box */}
        <div className="relative group">
          <div className="w-64 h-64 md:w-120 md:h-120 bg-gray-100 rounded-2xl overflow-hidden shadow-lg relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={images[(currentImage + 1) % images.length]}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[(currentImage + 1) % images.length]}
                  alt="CredLend Feature"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#14B9B5] rounded-2xl transition-all duration-300 pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      {/* ===== Navigation ===== */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-lg font-semibold">
            <Image
              src="/assets/logo.png"
              alt="CredLend"
              width={40}
              height={40}
              priority
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <span className="ml-2 text-sm md:text-lg">CredLend</span>
          </div>
          <div className="w-2 h-2 bg-[#14B9B5] rounded-full animate-[pulseGlow_2s_infinite]" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-2xl border border-[#14B9B5] text-[#14B9B5] hover:bg-gray-50 transition-colors text-sm"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="px-4 py-2 rounded-2xl bg-[#14B9B5] text-white hover:bg-white hover:text-[#14B9B5] transition-colors text-sm"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 px-4 py-4"
          >
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  router.push("/login");
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-3 rounded-2xl border border-[#14B9B5] text-[#14B9B5] hover:bg-gray-50 transition-colors text-center"
              >
                Login
              </button>
              <button
                onClick={() => {
                  router.push("/signup");
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-3 rounded-2xl bg-[#14B9B5] text-white hover:bg-white hover:text-[#14B9B5] transition-colors text-center"
              >
                Sign Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Hero Section ===== */}
      <section className="max-w-4xl mx-auto text-center px-4 md:px-6 pt-8 md:pt-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 mb-4 md:mb-6">
          Fast, Secure, Decentralized Lending.
        </h1>
        <p className="text-sm md:text-base text-black mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
          Experience the future of lending with CredLend. It&apos;s fast, secure,
          and fully decentralized. Powered by Solana, we make it effortless to
          borrow SOL or lend your assets with unmatched speed, transparency, and
          on-chain trust.
        </p>
        <AnimatedSignupButton />
      </section>

      {/* ===== Animated Image Boxes ===== */}
      <section className="max-w-8xl mx-auto px-6 md:px-8 mt-12 md:mt-20">
        <AnimatedImageBoxes />
      </section>

      {/* ===== How It Works ===== */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-12 md:mt-20">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-8 md:mb-15">
          Here is how it works
        </h2>
        <div className="flex flex-col items-center max-w-7xl mx-auto">
          {/* First row - 4 images */}
          <div className="flex justify-center items-center gap-4 md:gap-8 lg:gap-12 mb-4 md:mb-2.5 w-full px-4 overflow-x-auto md:overflow-visible">
            {[
              { src: "/assets/landingimage1.png", width: 250, height: 250, type: "large" },
              { src: "/assets/landing1.png", width: 110, height: 100, type: "small" },
              { src: "/assets/landingimage3.png", width: 250, height: 250, type: "large" },
              { src: "/assets/landing2.png", width: 110, height: 100, type: "small" }
            ].map((image, index) => (
              <div key={index} className="group relative flex-shrink-0">
                <Image
                  src={image.src}
                  alt="CredLend"
                  width={image.width}
                  height={image.height}
                  className={`
            ${image.type === "small"
                      ? "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28"
                      : "w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40"
                    }
            transition-all duration-300 object-contain group-hover:contrast-125
          `}
                />
              </div>
            ))}
          </div>

          {/* Second row - 3 images with offset on larger screens */}
          <div className="flex justify-center items-center gap-4 md:gap-8 lg:gap-12 w-full px-4 lg:ml-[10%] xl:ml-[15%] overflow-x-auto md:overflow-visible">
            {[
              { src: "/assets/landingimage2.png", width: 250, height: 250, type: "large" },
              { src: "/assets/landing3.png", width: 120, height: 100, type: "small" },
              { src: "/assets/landingimage4.png", width: 250, height: 250, type: "large" }
            ].map((image, index) => (
              <div key={index} className="group relative flex-shrink-0">
                <Image
                  src={image.src}
                  alt="CredLend"
                  width={image.width}
                  height={image.height}
                  className={`
            ${image.type === "small"
                      ? "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28"
                      : "w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40"
                    }
            transition-all duration-300 object-contain group-hover:contrast-125
          `}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12 md:mt-16">
          <p className="text-black mb-4 md:mb-6 text-sm md:text-base max-w-2xl mx-auto">
            Ready to dive into a world of decentralized lending? Join CredLend
            today.
          </p>
          <AnimatedSignupButton />
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="mt-16 md:mt-20 border-t border-gray-200 py-8 bg-[#076d6b]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center text-lg font-semibold">
                <Image
                  src="/assets/logo.png"
                  alt="CredLend"
                  width={40}
                  height={40}
                  className="w-8 h-8 md:w-10 md:h-10"
                />
                <span className="ml-2 text-white text-sm md:text-lg">CredLend</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-white text-sm">
                Copyright © {new Date().getFullYear()} CredLend
              </div>
            </div>

            {/* Social Media Icons using react-icons */}
            <div className="flex items-center gap-4 md:gap-6 text-white">
              <a
                href="#"
                className="hover:text-[#14B9B5] transition-transform hover:scale-110"
                aria-label="Twitter"
              >
                <FiTwitter size={25} />
              </a>

              <a
                href="#"
                className="hover:text-[#14B9B5] transition-transform hover:scale-110"
                aria-label="Discord"
              >
                <FaDiscord size={25} />
              </a>

              <a
                href="#"
                className="hover:text-[#14B9B5] transition-transform hover:scale-110"
                aria-label="Telegram"
              >
                <FaTelegram size={25} />
              </a>

              <a
                href="#"
                className="hover:text-[#14B9B5] transition-transform hover:scale-110"
                aria-label="GitHub"
              >
                <FiGithub size={25} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}