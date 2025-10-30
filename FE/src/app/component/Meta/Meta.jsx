"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    transactions: 0,
    loansBorrowed: 0,
    loansRepaid: 0,
  });

  const [balanceData, setBalanceData] = useState({
    totalBalance: "0.00",
    comparison: "",
  });

  const [walletData, setWalletData] = useState(null);

  const [calendarData, setCalendarData] = useState({
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    transactionDates: [],
    loanDueDates: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      fetchDashboardData(token);
    }
    setCheckingAuth(false);
  }, [router]);

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const [transactionsRes, loansRes, walletRes, balanceRes] = await Promise.all([
        fetch(`https://credlend.pythonanywhere.com/api/transactions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`https://credlend.pythonanywhere.com/api/loans/applications/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`https://credlend.pythonanywhere.com/api/users/wallet/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`https://credlend.pythonanywhere.com/api/users/balance/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // FIXED: Transactions counting logic
      let transactionsCount = 0;
      let transactionDates = [];
      
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        console.log("Dashboard transactions response:", data); // Debug log
        
        // Handle different response formats
        const transactions = Array.isArray(data)
          ? data
          : data.results || data.transactions || [];

        console.log("Processed transactions array:", transactions); // Debug log

        // Count ALL transactions (not just current month)
        transactionsCount = transactions.length;

        // For calendar, still filter by current month
        const currentMonthTransactions = transactions.filter((tx) => {
          if (!tx.created_at) return false;
          try {
            const date = new Date(tx.created_at);
            const isCurrentMonth =
              date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            if (isCurrentMonth) transactionDates.push(date.getDate());
            return isCurrentMonth;
          } catch {
            return false;
          }
        });

        console.log(`Total transactions: ${transactionsCount}, Current month: ${currentMonthTransactions.length}`); // Debug log
      } else {
        console.log("Transactions endpoint failed:", transactionsRes.status);
        // If main transactions endpoint fails, try deposits/withdrawals as fallback
        try {
          const [depositsRes, withdrawalsRes] = await Promise.all([
            fetch(`https://credlend.pythonanywhere.com/api/users/deposits/`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`https://credlend.pythonanywhere.com/api/users/withdrawals/`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          ]);

          let fallbackTransactions = [];
          
          if (depositsRes.ok) {
            const depositsData = await depositsRes.json();
            const deposits = Array.isArray(depositsData) ? depositsData : depositsData.results || depositsData.deposits || [];
            fallbackTransactions = [...fallbackTransactions, ...deposits];
          }
          
          if (withdrawalsRes.ok) {
            const withdrawalsData = await withdrawalsRes.json();
            const withdrawals = Array.isArray(withdrawalsData) ? withdrawalsData : withdrawalsData.results || withdrawalsData.withdrawals || [];
            fallbackTransactions = [...fallbackTransactions, ...withdrawals];
          }
          
          transactionsCount = fallbackTransactions.length;
          console.log("Fallback transactions count:", transactionsCount);
        } catch (fallbackError) {
          console.error("Fallback transactions fetch failed:", fallbackError);
        }
      }

      // Loans
      let loansBorrowedCount = 0;
      let loansRepaidCount = 0;
      let loanDueDates = [];

      if (loansRes.ok) {
        const data = await loansRes.json();
        const loans = Array.isArray(data)
          ? data
          : data.results || data.loans || [];

        const borrowed = loans.filter((loan) => {
          if (!loan.created_at) return false;
          const date = new Date(loan.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        loansBorrowedCount = borrowed.length;

        const repaid = loans.filter((loan) => loan.status === "repaid");
        loansRepaidCount = repaid.length;

        loans.forEach((loan) => {
          if (loan.status === "disbursed" && loan.disbursed_at && loan.duration_days) {
            const disbursedDate = new Date(loan.disbursed_at);
            const dueDate = new Date(
              disbursedDate.getTime() + loan.duration_days * 24 * 60 * 60 * 1000
            );
            if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
              loanDueDates.push(dueDate.getDate());
            }
          }
        });
      }

      // Wallet
      if (walletRes.ok) {
        const data = await walletRes.json();
        setWalletData(data);
      }

      // Balance
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        const solBalance = parseFloat(data.sol_balance || 0) * 184.24;
        const usdcBalance = parseFloat(data.usdc_balance || 0);
        const totalBalance = (solBalance + usdcBalance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        setBalanceData({
          totalBalance,
          comparison: data.comparison || "+0.00%",
        });
      }

      // ✅ Set all fetched real data
      setStats({
        transactions: transactionsCount, // Now shows TOTAL transactions count
        loansBorrowed: loansBorrowedCount,
        loansRepaid: loansRepaidCount,
      });

      setCalendarData((prev) => ({
        ...prev,
        transactionDates: [...new Set(transactionDates)],
        loanDueDates: [...new Set(loanDueDates)],
      }));

    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar UI
  const getCalendarDays = () => {
    const { currentMonth, currentYear, transactionDates, loanDueDates } = calendarData;
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        hasTransaction: transactionDates.includes(d),
        hasLoanDue: loanDueDates.includes(d),
      });
    }
    return days;
  };

  const navigateMonth = (direction) => {
    setCalendarData((prev) => {
      let newMonth = prev.currentMonth + direction;
      let newYear = prev.currentYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      return { ...prev, currentMonth: newMonth, currentYear: newYear };
    });
  };

  if (checkingAuth)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-sm animate-pulse">Checking session...</p>
      </div>
    );

  if (!isAuthenticated) return null;

  const calendarDays = getCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const currentMonthName = monthNames[calendarData.currentMonth];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F9996] mb-1">Overview</h1>
          <h2 className="text-sm font-semibold text-green-800">
            {currentMonthName} {calendarData.currentYear}
          </h2>
        </div>

        {/* Stats - Mobile responsive grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 text-[#08b3b0]">
          {[
            { label: "Transactions", value: stats.transactions },
            { label: "Loans Borrowed", value: stats.loansBorrowed },
            { label: "Loans Repaid", value: stats.loansRepaid },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-[#08b3b0] mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Calendar - Mobile responsive */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-[#0F9996] pb-2">
              <h2 className="text-sm font-bold text-[#0F9996]">
                {currentMonthName} {calendarData.currentYear}
              </h2>
              <div className="flex gap-1 sm:gap-2 items-center">
                <button 
                  onClick={() => navigateMonth(-1)} 
                  className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  ◀
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarData({
                      currentMonth: now.getMonth(),
                      currentYear: now.getFullYear(),
                      transactionDates: [],
                      loanDueDates: [],
                    });
                  }}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-[#0F9996] text-white rounded-lg hover:bg-[#0d8684] transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={() => navigateMonth(1)} 
                  className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs sm:text-sm text-[#0F9996]">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="font-medium">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-[#0F9996]">
              {calendarDays.map((dayInfo, index) => {
                if (!dayInfo) return <div key={`empty-${index}`} className="h-8 sm:h-12 rounded" />;
                const { day, hasTransaction, hasLoanDue } = dayInfo;
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === calendarData.currentMonth &&
                  new Date().getFullYear() === calendarData.currentYear;

                return (
                  <div
                    key={day}
                    className={`h-8 sm:h-12 flex items-center justify-center rounded-lg relative text-xs sm:text-sm ${
                      isToday
                        ? "bg-[#0F9996] text-white"
                        : hasTransaction
                          ? "bg-[#0F9996]/20 text-[#0F9996]"
                          : hasLoanDue
                            ? "bg-red-100 text-red-800"
                            : "text-gray-900 hover:bg-gray-100"
                    } cursor-pointer transition`}
                  >
                    {day}

                    {/* Dot indicators */}
                    <div className="absolute bottom-1 flex gap-1">
                      {hasTransaction && (
                        <div className="w-1 h-1 sm:w-2 sm:h-2 bg-[#0F9996] rounded-full"></div>
                      )}
                      {hasLoanDue && (
                        <div className="w-1 h-1 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#0F9996] rounded"></div>
                <span className="text-xs sm:text-sm text-gray-600">Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
                <span className="text-xs sm:text-sm text-gray-600">Loan Due</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#0F9996] rounded-full border border-white"></div>
                <span className="text-xs sm:text-sm text-gray-600">Today</span>
              </div>
            </div>
          </div>

          {/* Right Column - Balance & Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Balance Card - Mobile responsive */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your Balance</h3>
              {walletData && (
                <div className="flex items-center gap-3 mb-3 sm:mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#a8fcfa] rounded-full flex items-center justify-center">
                    <img src="/assets/logo.png" alt="Wallet" className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">CredLend Wallet</div>
                    <div className="text-xs text-gray-500">
                      {walletData.internal_wallet_address
                        ? `${walletData.internal_wallet_address.slice(0, 4)}...${walletData.internal_wallet_address.slice(-3)}`
                        : "No wallet connected"}
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-2">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Balance</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ${balanceData.totalBalance} <span className="text-lg sm:text-xl"></span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-green-600">
                Compared to last month ~ {balanceData.comparison}
              </div>
            </div>

            {/* Quick Actions - Mobile responsive */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                Need it fast? Do it here. Transfer, withdraw, or deposit in a tap — all powered by
                Solana speed.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: "Transfer", path: "/deposit", primary: true },
                  { label: "Deposit", path: "/deposit" },
                  { label: "Withdraw", path: "/withdraw" },
                  { label: "APR Calculator", path: "/calculator" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => router.push(btn.path)}
                    className={`py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition ${
                      btn.primary
                        ? "bg-[#0F9996] text-white hover:bg-[#0d8684]"
                        : "bg-white border border-[#0F9996] text-[#0F9996] hover:bg-[#0F9996] hover:text-white"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#0F9996] mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-600 text-sm">Loading dashboard data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}