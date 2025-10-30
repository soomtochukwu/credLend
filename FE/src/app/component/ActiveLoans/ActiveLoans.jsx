"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { FaMoneyCheckAlt, FaSearch } from "react-icons/fa";

export default function ActiveLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("https://credlend.pythonanywhere.com/api/loans/applications/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (!res.ok) throw new Error("Failed to fetch loans");

        const data = await res.json();
        console.log("API Response:", data); // Debug log

        // Handle different response formats safely
        let loanData = [];
        if (Array.isArray(data)) {
          loanData = data;
        } else if (Array.isArray(data.results)) {
          loanData = data.results;
        } else if (Array.isArray(data.loans)) {
          loanData = data.loans;
        } else if (data && typeof data === 'object') {
          // If it's an object but not an array, check for common properties
          loanData = Object.values(data).find(Array.isArray) || [];
        }

        console.log("Processed loan data:", loanData); // Debug log

        // Filter loans with selected statuses (case insensitive)
        const activeStatuses = ['under_review', 'approved', 'disbursed', 'Under Review', 'Approved', 'Disbursed'];
        const activeLoans = loanData.filter(loan =>
          loan && loan.status && activeStatuses.includes(loan.status)
        );

        console.log("Active loans:", activeLoans); // Debug log
        setLoans(activeLoans);

      } catch (error) {
        console.error("Error fetching loans:", error);
        // Set empty array on error - no mock data
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [router]);

  // Calculate remaining days for disbursed loans
  const calculateRemainingDays = (startDate, duration) => {
    if (!startDate) return duration;
    try {
      const start = new Date(startDate);
      const dueDate = new Date(start.getTime() + (duration || 30) * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (error) {
      return 6; // Default fallback
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';

    const statusMap = {
      'disbursed': 'Ongoing',
      'approved': 'Approved',
      'under_review': 'Under Review',
      'Disbursed': 'Ongoing',
      'Approved': 'Approved',
      'Under Review': 'Under Review'
    };

    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-4 px-3 sm:py-8 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            {/* Loading state content */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-3 sm:py-8 sm:px-4">
      {/* Active Loans Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-1">
        <h2 className="text-sm sm:text-lg font-bold text-[#00615F] mb-3">Active loans</h2>

        {loans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-40 h-40 flex items-center justify-center mx-auto mb-4">
              <img 
                src="/assets/data.png" 
                alt="No active loans" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#00615F] mb-2">
              You do not have active loans
            </h3>
            <p className="text-[#00615F] text-sm mb-6">
              Start by applying for a new loan or check your pending applications.
            </p>
            <button
              onClick={() => router.push("/loan")}
              className="bg-[var(--cred-teal)] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
            >
              Apply for a Loan
              <FiArrowRight />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#00615F]">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#00615F]">Collateral</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#00615F]">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#00615F]">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#00615F]">.....</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, index) => {
                  const remainingDays = (loan.status === 'disbursed' || loan.status === 'Disbursed') ?
                    calculateRemainingDays(loan.disbursed_at || loan.created_at, loan.duration_days || loan.duration || 30) :
                    null;

                  const displayStatus = formatStatus(loan.status);
                  const isDisbursed = loan.status === 'disbursed' || loan.status === 'Disbursed';

                  return (
                    <tr key={loan.id || index} className="border-b border-[#016b26] hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm text-[#00615F]">
                          {loan.amount || loan.loan_amount} USDC
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-[#00615F] text-sm">
                          {loan.collateral || "N/A"}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-[#00615F]">
                          {loan.duration_days || loan.duration || '30'} days
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {isDisbursed && (
                            <span className="text-[#C78304] text-sm rounded-full py-2 px-4 bg-[#FAF1E1]">
                              {displayStatus}, {remainingDays || 6} days
                            </span>
                          )}
                          {!isDisbursed && displayStatus === 'Approved' && (
                            <span className="text-[#00615F] font-medium">{displayStatus}</span>
                          )}
                          {!isDisbursed && displayStatus === 'Under Review' && (
                            <span className="text-yellow-600 font-medium">{displayStatus}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isDisbursed && (
                          <button
                            onClick={() => router.push("/loan/repayment")}
                            className="text-[#00615F] underline transition-colors text-sm flex items-center gap-2"
                          >
                            Pay
                          </button>
                        )}
                        {!isDisbursed && (
                          <span className="text-orange-200 text-sm">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}