"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
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
  FiXCircle
} from "react-icons/fi";
import { HiOutlineWallet } from "react-icons/hi2";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [creditFactors, setCreditFactors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreditScorePopup, setShowCreditScorePopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // 🔹 Fetch user profile and credit score
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in first.");
      router.push("/login");
      return;
    }

    const fetchProfileData = async () => {
      try {
        const [profileRes, creditScoreRes] = await Promise.all([
          fetch("https://credlend.pythonanywhere.com/api/users/profile/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://credlend.pythonanywhere.com/api/users/credit-score/", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        
        const profileData = await profileRes.json();
        setUser(profileData);

        // Handle credit score response
        if (creditScoreRes.ok) {
          const creditScoreData = await creditScoreRes.json();
          setCreditScore(creditScoreData);
        } else {
          // Set default credit score if API fails
          setCreditScore({ score: 650, score_tier: "Good" });
        }

        // Fetch detailed factors
        try {
          const factorsRes = await fetch("https://credlend.pythonanywhere.com/api/users/credit-score/factors/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (factorsRes.ok) {
            const factorsData = await factorsRes.json();
            setCreditFactors(factorsData);
          }
        } catch (factorsError) {
          console.log("Could not load credit factors:", factorsError);
          // Set default factors if API fails
          setCreditFactors({
            kyc_verified: 85,
            wallet_age: 70,
            transaction_frequency: 65,
            payment_history: 90,
            platform_activity: 60
          });
        }

      } catch (error) {
        console.error("Profile data error:", error);
        toast.error("Could not load profile data");
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
        
        // Refresh factors
        try {
          const factorsRes = await fetch("https://credlend.pythonanywhere.com/api/users/credit-score/factors/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (factorsRes.ok) {
            const factorsData = await factorsRes.json();
            setCreditFactors(factorsData);
          }
        } catch (factorsError) {
          console.log("Could not refresh factors:", factorsError);
        }
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
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
    <div className="min-h-screen bg-white">
      {/* Profile Section */}
      <div className="flex flex-col items-center px-4 py-6 sm:px-6 md:px-10">
        {/* 🔹 Back Arrow */}
        <button
          onClick={() => router.back()}
          className="self-start mb-4 text-gray-700 hover:text-emerald-600 transition"
        >
          <FiArrowLeft size={22} />
        </button>

        {/* Profile Avatar */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-black text-white text-2xl font-semibold shadow-sm">
          {initials || "U"}
        </div>

        {/* Name */}
        <h2 className="mt-4 text-lg sm:text-xl font-semibold text-gray-800">
          {firstName} {lastName}
        </h2>

        {/* Badge Section - Credit Score Clickable */}
        <div 
          onClick={() => setShowCreditScorePopup(true)}
          className="flex items-center justify-between bg-white border rounded-lg shadow-sm w-full max-w-sm mt-4 px-4 py-3 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <FiTrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Credit Score
            </p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${scoreInfo.color}`}>
              {currentScore}
            </div>
            <p className="text-xs text-gray-500">{creditTier}</p>
          </div>
        </div>

        {/* Switch mode */}
        <a href="/lenders" className="mt-4">
          <p className="text-emerald-600 text-sm underline cursor-pointer hover:text-emerald-700">
            Switch to lender mode
          </p>
        </a>

        {/* Options */}
        <div className="mt-6 space-y-3 w-full max-w-sm">
          <Option
            icon={<FiEdit2 />}
            text="Edit profile"
            onClick={() => router.push("/edit-profile")}
          />
          <Option
            icon={<FiLock />}
            text="Change password"
            onClick={() => router.push("/change-password")}
          />
          <Option
            icon={<HiOutlineWallet />}
            text="Connected wallets"
            onClick={() => router.push("/wallet")}
          />
          <Option
            icon={<FiFileText />}
            text="Terms and conditions"
            onClick={() => router.push("/policy")}
          />
          <Option
            icon={<FiBell />}
            text="Loan Dashboard"
            onClick={() => router.push("/loan/dashboard")}
          />
          <Option 
            icon={<FiLogOut />} 
            text="Logout" 
            onClick={confirmLogout} 
            isLogout={true}
          />
        </div>
      </div>

      {/* Credit Score Popup - Responsive for mobile */}
      {showCreditScorePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Credit Score Details</h3>
              <button
                onClick={() => setShowCreditScorePopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              {/* Main Score Display */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white text-center mb-4 sm:mb-6">
                <div className="text-3xl sm:text-4xl font-bold mb-2">{currentScore}</div>
                <div className="text-base sm:text-lg opacity-90">{creditTier}</div>
                
                {/* Score Range */}
                <div className="mt-3 sm:mt-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span>300</span>
                    <span>850</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((currentScore - 300) / (850 - 300)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Credit Factors */}
              {creditFactors && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <FiTrendingUp size={16} />
                    Score Breakdown
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(creditFactors)
                      .filter(([_, value]) => typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean')
                      .map(([factor, value]) => (
                        <div key={factor} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs sm:text-sm text-gray-700">
                            {formatFactorName(factor)}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-emerald-600">
                            {formatFactorValue(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Improvement Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <div className="text-xs sm:text-sm text-blue-800">
                    <p className="font-semibold mb-1 sm:mb-2">Ways to Improve Your Score:</p>
                    <ul className="space-y-1">
                      <li>• Complete KYC verification</li>
                      <li>• Maintain consistent wallet activity</li>
                      <li>• Repay loans on time</li>
                      <li>• Keep your account active</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recalculate Button */}
              <button
                onClick={handleRecalculateScore}
                disabled={recalculating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                <FiRefreshCw size={16} className={recalculating ? "animate-spin" : ""} />
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
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                <FiXCircle size={18} />
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
              >
                <FiCheck size={18} />
                Logout
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
    </div>
  );
}

/* Option Item Component */
function Option({ icon, text, onClick, isLogout = false }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg py-3 px-4 cursor-pointer transition-all duration-200 ${
        isLogout 
          ? "bg-red-50 hover:bg-red-100 text-red-700" 
          : "bg-emerald-50 hover:bg-emerald-100 text-gray-800"
      }`}
    >
      <span className={`text-sm font-medium ${isLogout ? "text-red-700" : "text-gray-800"}`}>
        {text}
      </span>
      <span className={`text-lg ${isLogout ? "text-red-700" : "text-emerald-600"}`}>
        {icon}
      </span>
    </div>
  );
}