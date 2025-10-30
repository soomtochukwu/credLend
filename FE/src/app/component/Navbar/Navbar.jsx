"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Logo from "../Logo/Logo";
import {
  FiEdit2,
  FiLock,
  FiLogOut,
  FiBell,
  FiFileText,
  FiX,
  FiTrendingUp,
  FiInfo,
  FiRefreshCw,
  FiCheck,
  FiXCircle,
  FiMenu,
  FiSettings
} from "react-icons/fi";
import { HiOutlineWallet } from "react-icons/hi2";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [creditFactors, setCreditFactors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showCreditScoreDetails, setShowCreditScoreDetails] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔹 Fetch user profile and credit score
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    const fetchProfileData = async () => {
      try {
        const [profileRes, creditScoreRes, walletRes] = await Promise.all([
          fetch("https://credlend.pythonanywhere.com/api/users/profile/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://credlend.pythonanywhere.com/api/users/credit-score/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://credlend.pythonanywhere.com/api/users/wallet/", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData);
        }

        if (creditScoreRes.ok) {
          const creditScoreData = await creditScoreRes.json();
          setCreditScore(creditScoreData);
        }

        // Fetch detailed factors
        try {
          const factorsRes = await fetch("https://credlend.pythonanywhere.com/api/users/credit-score/factors/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (factorsRes.ok) {
            const factorsData = await factorsRes.json();
            // Ensure we only store simple values, not nested objects
            const simpleFactors = {};
            if (factorsData && typeof factorsData === 'object') {
              Object.entries(factorsData).forEach(([key, value]) => {
                if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
                  simpleFactors[key] = value;
                }
              });
            }
            setCreditFactors(simpleFactors);
          }
        } catch (factorsError) {
          console.log("Could not load credit factors");
        }

        // Fetch connected wallets
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          if (walletData.has_internal_wallet && walletData.internal_wallet_address) {
            setConnectedWallets([{
              address: walletData.internal_wallet_address,
              type: "Internal Wallet",
              connected: true
            }]);
          }
        }

      } catch (error) {
        console.error("Could not load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  // 🔹 Recalculate credit score
  const handleRecalculateScore = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setRecalculating(true);
    try {
      const response = await fetch("https://credlend.pythonanywhere.com/api/users/credit-score/recalculate/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const newScoreData = await response.json();
        setCreditScore(newScoreData.credit_score || newScoreData);
        toast.success("Credit score recalculated!");
      } else {
        toast.error("Failed to recalculate credit score");
      }
    } catch (error) {
      toast.error("Error recalculating credit score");
    } finally {
      setRecalculating(false);
    }
  };

  // 🔹 Logout function
  const handleLogout = () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out. Try again.");
    }
  };

  // 🔹 Confirm logout
  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  // 🔹 Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // 🔹 Get credit score color and tier
  const getCreditScoreInfo = (score) => {
    if (score >= 800) return { color: "text-green-600", bg: "bg-green-100", tier: "Excellent" };
    if (score >= 740) return { color: "text-green-500", bg: "bg-green-50", tier: "Very Good" };
    if (score >= 670) return { color: "text-yellow-600", bg: "bg-yellow-100", tier: "Good" };
    if (score >= 580) return { color: "text-orange-600", bg: "bg-orange-100", tier: "Fair" };
    return { color: "text-red-600", bg: "bg-red-100", tier: "Poor" };
  };

  // 🔹 Format wallet address
  const formatWalletAddress = (address) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 🔹 Format factor name for display
  const formatFactorName = (factor) => {
    const nameMap = {
      kyc_verified: 'KYC Verified',
      wallet_age: 'Wallet Age',
      transaction_frequency: 'Transaction Frequency',
      payment_history: 'Payment History',
      platform_activity: 'Platform Activity',
      loan_history: 'Loan History',
      collateral_ratio: 'Collateral Ratio'
    };
    return nameMap[factor] || factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // 🔹 Format factor value for display
  const formatFactorValue = (value) => {
    if (typeof value === 'number') {
      return `${value} pts`;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Logo />
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  
  const currentScore = creditScore?.score || user?.credit_score || 650;
  const scoreInfo = getCreditScoreInfo(currentScore);
  const creditTier = creditScore?.score_tier || scoreInfo.tier;

  return (
    <>
      {/* Navbar */}
      <div className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
        {/* Left Side - Logo */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Toggle Button */}
            <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <img 
                src="/assets/toggle.png" 
                alt="Toggle" 
                className="w-5 h-5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <FiSettings className="w-5 h-5" style={{display: 'none'}} />
            </button>

            {/* Notification Icon */}
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <img 
                src="/assets/notification.png" 
                alt="Notifications" 
                className="w-5 h-5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <FiBell className="w-5 h-5" style={{display: 'none'}} />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* Mobile Hamburger Menu */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <FiMenu size={20} />
          </button>

          {/* Profile Avatar - Hidden on mobile, shown on desktop */}
          <div 
            onClick={() => setShowProfilePopup(true)}
            className="hidden md:flex w-8 h-8 rounded-full items-center justify-center bg-black text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          >
            {initials || "U"}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 right-4 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-scale-in">
          <div className="p-2 space-y-1">
            {/* Mobile Profile */}
            <button
              onClick={() => {
                setShowProfilePopup(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black text-white text-xs font-semibold">
                {initials || "U"}
              </div>
              <span className="text-sm font-medium">Profile</span>
            </button>

            {/* Mobile Toggle */}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
              <img 
                src="/assets/toggle.png" 
                alt="Toggle" 
                className="w-5 h-5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <FiSettings className="w-5 h-5" style={{display: 'none'}} />
              <span className="text-sm font-medium">Settings</span>
            </button>

            {/* Mobile Notifications */}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors relative">
              <img 
                src="/assets/notification.png" 
                alt="Notifications" 
                className="w-5 h-5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <FiBell className="w-5 h-5" style={{display: 'none'}} />
              <span className="text-sm font-medium">Notifications</span>
              <span className="absolute left-6 top-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Quick Actions */}
            <button
              onClick={() => {
                router.push("/wallet");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <HiOutlineWallet size={18} />
              <span className="text-sm font-medium">Wallet</span>
            </button>

            <button
              onClick={() => {
                setShowCreditScoreDetails(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <FiTrendingUp size={18} />
              <span className="text-sm font-medium">Credit Score</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Logout */}
            <button
              onClick={() => {
                confirmLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <FiLogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-10 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Profile Popup */}
      {showProfilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Profile</h3>
              <button
                onClick={() => setShowProfilePopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Profile Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-black text-white text-2xl font-semibold mb-4">
                  {initials || "U"}
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {firstName} {lastName}
                </h2>
              </div>

              {/* Credit Score Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FiTrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Credit Score
                      </p>
                      <p className="text-xs text-gray-500">
                        Current Tier: <span className={`font-semibold ${scoreInfo.color}`}>{creditTier}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${scoreInfo.color}`}>
                      {currentScore}
                    </div>
                    <button
                      onClick={handleRecalculateScore}
                      disabled={recalculating}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <FiRefreshCw size={12} className={recalculating ? "animate-spin" : ""} />
                      {recalculating ? "Recalculating..." : "Recalculate"}
                    </button>
                  </div>
                </div>

                {/* Credit Score Details Button */}
                <button
                  onClick={() => setShowCreditScoreDetails(true)}
                  className="w-full mt-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiInfo size={16} />
                  View Score Details
                </button>
              </div>

              {/* Connected Wallets Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <HiOutlineWallet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Connected Wallets
                      </p>
                      <p className="text-xs text-gray-500">
                        {connectedWallets.length > 0 ? `${connectedWallets.length} wallet connected` : 'No wallets connected'}
                      </p>
                    </div>
                  </div>
                </div>

                {connectedWallets.length > 0 ? (
                  <div className="space-y-2">
                    {connectedWallets.map((wallet, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <img 
                            src="/assets/trustwallet.png" 
                            alt="Trust Wallet" 
                            className="w-6 h-6"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <HiOutlineWallet className="h-5 w-5 text-purple-600" style={{display: 'none'}} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{wallet.type}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              {formatWalletAddress(wallet.address)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Connected
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowProfilePopup(false);
                      router.push("/wallet");
                    }}
                    className="w-full py-3 text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <HiOutlineWallet size={16} />
                    Connect Your Wallet
                  </button>
                )}
              </div>

              {/* Menu Options */}
              <div className="space-y-3 mb-6">
                <Option
                  icon={<FiEdit2 />}
                  text="Edit profile"
                  onClick={() => {
                    setShowProfilePopup(false);
                    router.push("/edit-profile");
                  }}
                />
                <Option
                  icon={<FiLock />}
                  text="Change password"
                  onClick={() => {
                    setShowProfilePopup(false);
                    router.push("/change-password");
                  }}
                />
                <Option
                  icon={<HiOutlineWallet />}
                  text="Wallet Management"
                  onClick={() => {
                    setShowProfilePopup(false);
                    router.push("/wallet");
                  }}
                />
                <Option
                  icon={<FiBell />}
                  text="Notifications"
                  onClick={() => {
                    setShowProfilePopup(false);
                    router.push("/notifications");
                  }}
                />
                <Option
                  icon={<FiFileText />}
                  text="Terms and conditions"
                  onClick={() => {
                    setShowProfilePopup(false);
                    router.push("/policy");
                  }}
                />
              </div>

              {/* Switch Mode */}


              {/* Logout Button */}
              <button
                onClick={confirmLogout}
                className="w-full flex items-center justify-center gap-2 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                <FiLogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Score Details Modal - FIXED VERSION */}
      {showCreditScoreDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Credit Score Details</h3>
              <button
                onClick={() => setShowCreditScoreDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Score Display */}
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold ${scoreInfo.color} mb-2`}>
                  {currentScore}
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${scoreInfo.bg} ${scoreInfo.color}`}>
                  {creditTier} Tier
                </div>
              </div>

              {/* Credit Factors - FIXED: Only render simple values */}
              {creditFactors && typeof creditFactors === 'object' && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-800">Score Factors</h4>
                  {Object.entries(creditFactors)
                    .filter(([_, value]) => typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean')
                    .map(([factor, value]) => (
                      <div key={factor} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">
                          {formatFactorName(factor)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatFactorValue(value)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Recalculate Button */}
              <button
                onClick={handleRecalculateScore}
                disabled={recalculating}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiRefreshCw size={18} className={recalculating ? "animate-spin" : ""} />
                {recalculating ? "Recalculating..." : "Recalculate Score"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <FiLogOut className="text-red-600" size={24} />
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Confirm Logout
              </h3>
              <p className="text-gray-600">
                Are you sure you want to log out? You'll need to sign in again to access your account.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <FiXCircle size={18} />
                No, Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <FiCheck size={18} />
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

/* Option Item Component */
function Option({ icon, text, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between rounded-lg py-3 px-4 cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-800 transition-all duration-200"
    >
      <span className="text-sm font-medium text-gray-800">
        {text}
      </span>
      <span className="text-lg text-emerald-600">
        {icon}
      </span>
    </div>
  );
}