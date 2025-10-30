"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FaMoneyCheckAlt,
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaPercentage,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaRocket
} from "react-icons/fa";
import { FaShieldAlt } from "react-icons/fa";

import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiTrendingUp,
  FiCalendar,
  FiCreditCard,
  FiInfo
} from "react-icons/fi";
import { BsBank2, BsGraphUp } from "react-icons/bs";

export default function LoanDashboard() {
  const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in to view your loans.");
      router.push("/login");
      return;
    }
    fetchUserLoans(token);
    fetchLoanProducts(token);
  }, []);

  async function fetchLoanProducts(token) {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/loans/products/",
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setLoanProducts(data);
      } else {
        // Use default products if API fails
        setLoanProducts(getDefaultLoanProducts());
      }
    } catch (error) {
      console.error("Error fetching loan products:", error);
      setLoanProducts(getDefaultLoanProducts());
    }
  }

  // Default loan products based on your current structure
  const getDefaultLoanProducts = () => [
    {
      id: 1,
      name: "category A: secured",
      loan_type: "personal",
      description: "personal loans for normal day to day life minimum loan application $5 and maximum $1,000 and a min duration of one months month(30 days) and max six months(180 days) with a 8% charge on every loan",
      min_amount: "5.00",
      max_amount: "2000.00",
      min_duration: 30,
      max_duration: 365,
      interest_rate: "6.00",
      collateral_required: false,
      collateral_type: null,
      ltv_ratio: null,
      min_credit_score: 550
    },
    {
      id: 4,
      name: "category B: short term",
      loan_type: "personal",
      description: "a normal loan application for credlend minimum loan application $5 and maximum $1,000 and a min duration of one months month(30 days) and max six months(180 days) with a 8% charge on every loan",
      min_amount: "5.00",
      max_amount: "1000.00",
      min_duration: 30,
      max_duration: 180,
      interest_rate: "8.00",
      collateral_required: false,
      collateral_type: null,
      ltv_ratio: null,
      min_credit_score: 600
    }
  ];

  async function fetchUserLoans(token) {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/loans/applications/",
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch loans");

      const data = await res.json();
      console.log("Loan response:", data);

      let loanData = [];
      if (Array.isArray(data)) {
        loanData = data;
      } else if (Array.isArray(data.results)) {
        loanData = data.results;
      } else if (Array.isArray(data.loans)) {
        loanData = data.loans;
      } else {
        console.warn("⚠️ Unexpected loan data format:", data);
      }

      // Enhance loan data with calculated fields and product info
      const enhancedLoans = loanData.map(loan => {
        const loanProduct = loanProducts.find(p => p.id === loan.loan_product) ||
          getDefaultLoanProducts().find(p => p.id === loan.loan_product) ||
          getDefaultLoanProducts()[0]; // fallback

        return {
          ...loan,
          loan_product_details: loanProduct,
          calculated: calculateLoanDetails(loan, loanProduct)
        };
      });

      setLoans(enhancedLoans);
    } catch (err) {
      console.error("Loan fetch error:", err);
      toast.error("Could not load your loans");
    } finally {
      setLoading(false);
    }
  }

  // Calculate loan details with dynamic interest rate - ONLY for disbursed loans
  function calculateLoanDetails(loan, loanProduct) {
    const amount = parseFloat(loan.amount) || 0;
    const duration = parseInt(loan.duration_days) || 0;
    const interestRate = parseFloat(loanProduct?.interest_rate) || 6; // Dynamic interest rate

    if (amount <= 0 || duration <= 0) return null;

    const interest = (amount * interestRate / 100) * (duration / 365);
    const totalRepayment = amount + interest;
    const dailyPayment = totalRepayment / duration;

    // Only calculate remaining days and progress for DISBURSED loans
    const remainingDays = loan.status === 'disbursed' ? calculateRemainingDays(loan.disbursed_at || loan.created_at, duration) : duration;
    const progress = loan.status === 'disbursed' ? calculateProgress(loan.disbursed_at || loan.created_at, duration) : 0;

    return {
      interest: interest.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      dailyPayment: dailyPayment.toFixed(2),
      remainingDays,
      progress,
      interestRate: interestRate,
      isActive: loan.status === 'disbursed' // Flag to indicate if loan is active for counting
    };
  }

  function calculateRemainingDays(startDate, duration) {
    if (!startDate) return duration;
    const start = new Date(startDate);
    const dueDate = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  function calculateProgress(startDate, duration) {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const elapsed = now - start;
    const total = duration * 24 * 60 * 60 * 1000;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  function getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'disbursed':
        return <FaRocket className="text-purple-500" size={14} />;
      case 'approved':
      case 'active':
      case 'completed':
        return <FaCheckCircle className="text-green-500" size={14} />;
      case 'pending':
      case 'under_review':
      case 'submitted':
      case 'draft':
        return <FaHourglassHalf className="text-yellow-500" size={14} />;
      case 'rejected':
      case 'cancelled':
      case 'defaulted':
      case 'canceled':
        return <FaTimesCircle className="text-red-500" size={14} />;
      default:
        return <FaHourglassHalf className="text-gray-500" size={14} />;
    }
  }

  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'disbursed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved':
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'under_review':
      case 'submitted':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
      case 'cancelled':
      case 'defaulted':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // ✨ Animated Loader Component
  const Loader = ({ message }) => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-[var(--cred-teal)] text-white space-y-6 px-4">
      <div className="flex items-center justify-center space-x-4">
        <div className="bg-white p-3 rounded-full shadow-md">
          <img src="/assets/logo.png" alt="Credlend Logo" className="w-10 h-10" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-6 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
            <div className="w-2 h-6 bg-white rounded-full animate-bounce [animation-delay:-0.1s]" />
            <div className="w-2 h-6 bg-white rounded-full animate-bounce" />
          </div>
          <FaMoneyCheckAlt className="text-4xl animate-pulse" />
        </div>
      </div>
      <h2 className="text-xl font-semibold">{message}</h2>
      <p className="text-sm opacity-90">
        Please wait while we securely retrieve your loan data...
      </p>
    </div>
  );

  if (loading) return <Loader message="Fetching your loan records..." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cred-teal)] to-[#0ea79b]/70 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors self-start"
          >
            <FiArrowLeft size={20} />
            <span className="text-sm sm:text-base">Back</span>
          </button>

          <div className="text-center order-first sm:order-none">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Loan Dashboard</h1>
            <p className="text-white/80 mt-1 text-xs sm:text-sm">
              Track and manage your loan applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/loan")}
              className="bg-white text-[var(--cred-teal)] px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base self-end"
            >
              Apply New Loan
            </button>
            <button
              onClick={() => router.push("/loan/repayment")}
              className="bg-white text-[var(--cred-teal)] px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base self-end"
            >
              repay loans
            </button>
          </div>
        </div>

        {/* Stats Overview - Mobile Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Total Loans"
            value={loans.length}
            icon={<BsBank2 className="text-blue-500" size={16} />}
            color="blue"
          />
          <StatCard
            title="Active Loans"
            value={loans.filter(l => l.status === 'disbursed').length}
            icon={<FaRocket className="text-purple-500" size={16} />}
            color="purple"
          />
          <StatCard
            title="Pending"
            value={loans.filter(l => ['pending', 'submitted', 'under_review', 'draft', 'approved'].includes(l.status)).length}
            icon={<FaHourglassHalf className="text-yellow-500" size={16} />}
            color="yellow"
          />
          <StatCard
            title="Total Borrowed"
            value={`$${loans.reduce((sum, loan) => sum + parseFloat(loan.amount || 0), 0).toLocaleString()}`}
            icon={<FiTrendingUp className="text-green-500" size={16} />}
            color="green"
          />
        </div>

        {/* Loan List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6">
          {loans.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FaMoneyCheckAlt className="text-gray-300 text-4xl sm:text-6xl mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Loans Yet</h3>
              <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">You haven't applied for any loans yet.</p>
              <button
                onClick={() => router.push("/loan")}
                className="bg-[var(--cred-teal)] text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
              >
                Apply for Your First Loan
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {loans.map((loan, index) => (
                <LoanCard
                  key={loan.id || loan.uuid || index}
                  loan={loan}
                  onViewDetails={() => {
                    setSelectedLoan(loan);
                    setShowDetails(true);
                  }}
                  showBalance={showBalance}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loan Details Modal - Mobile Optimized */}
      {showDetails && selectedLoan && (
        <LoanDetailsModal
          loan={selectedLoan}
          onClose={() => setShowDetails(false)}
          showBalance={showBalance}
        />
      )}
    </div>
  );
}

// Stat Card Component - Mobile Optimized
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg sm:rounded-xl p-3 sm:p-4 text-center`}>
      <div className="flex justify-center mb-1 sm:mb-2">{icon}</div>
      <div className="text-lg sm:text-2xl font-bold text-gray-800 mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-gray-600 leading-tight">{title}</div>
    </div>
  );
}

// Loan Card Component - Mobile Optimized
function LoanCard({ loan, onViewDetails, showBalance }) {
  const status = loan.status || 'pending';
  const calculated = loan.calculated;
  const loanProduct = loan.loan_product_details;
  const isDisbursed = status === 'disbursed';

  return (
    <div className={`border rounded-lg sm:rounded-xl p-3 sm:p-5 hover:shadow-md transition-shadow ${isDisbursed ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'
      }`}>
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusIcon(status)}
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              {isDisbursed && ' 🚀'}
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">
              #{loan.id || 'N/A'} • {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <span className="text-xs text-gray-500 sm:hidden">
            #{loan.id || 'N/A'}
          </span>
        </div>

        {/* Mobile Date */}
        <div className="text-xs text-gray-500 sm:hidden">
          Applied {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : 'N/A'}
          {isDisbursed && loan.disbursed_at && (
            <span className="text-purple-600 ml-2">
              • Disbursed {new Date(loan.disbursed_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Loan Product Info */}
        {loanProduct && (
          <div className={`border rounded-lg p-2 ${isDisbursed ? 'bg-white border-purple-200' : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-center gap-2">
              <FiInfo className={isDisbursed ? "text-purple-600" : "text-blue-600"} size={12} />
              <span className={`text-xs font-semibold ${isDisbursed ? 'text-purple-800' : 'text-blue-800'}`}>
                {loanProduct.name}
              </span>
              {loanProduct.collateral_required && (
                <FaShieldAlt className="text-orange-500" size={10} />
              )}
            </div>
            <div className={`text-xs mt-1 ${isDisbursed ? 'text-purple-600' : 'text-blue-600'}`}>
              Interest: {loanProduct.interest_rate}% •
              {loanProduct.collateral_required ? ' Collateral Required' : ' No Collateral'}
              {isDisbursed && ' • Active Repayment'}
            </div>
          </div>
        )}

        {/* Info Grid - Mobile Stacked */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs sm:text-sm">Amount</div>
            <div className="font-semibold text-gray-800 text-sm sm:text-base">
              {showBalance ? `$${parseFloat(loan.amount || 0).toLocaleString()}` : '●●●●'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs sm:text-sm">Duration</div>
            <div className="font-semibold text-gray-800 text-sm sm:text-base">{loan.duration_days || 'N/A'} days</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs sm:text-sm">Interest Rate</div>
            <div className="font-semibold text-gray-800 text-sm sm:text-base">
              {loanProduct?.interest_rate || calculated?.interestRate || '6'}%
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs sm:text-sm">
              {isDisbursed ? 'Due Date' : 'Status'}
            </div>
            <div className="font-semibold text-gray-800 text-sm sm:text-base">
              {isDisbursed ? (calculated?.remainingDays > 0 ? `${calculated.remainingDays} days` : 'Due Now') : status}
            </div>
          </div>
        </div>

        {/* Purpose - Mobile Truncated */}
        {loan.purpose && (
          <div>
            <div className="text-gray-500 text-xs sm:text-sm">Purpose</div>
            <div className="text-gray-800 text-xs sm:text-sm line-clamp-2">{loan.purpose}</div>
          </div>
        )}

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={onViewDetails}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 sm:gap-2 ${isDisbursed
                ? 'bg-purple-600 text-white'
                : 'bg-[var(--cred-teal)] text-white'
              }`}
          >
            <FiEye size={12} />
            View Details
          </button>

          {/* Only show progress for DISBURSED loans */}
          {isDisbursed && calculated && calculated.isActive && (
            <div className="text-center sm:text-right">
              <div className="text-xs text-gray-500">
                {calculated.remainingDays > 0 ? `Due in ${calculated.remainingDays} days` : 'Payment Due Now'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                <div
                  className="bg-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculated.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Show different message for approved but not disbursed loans */}
          {status === 'approved' && (
            <div className="text-center sm:text-right">
              <div className="text-xs text-green-600 font-semibold">
                ✅ Approved - Awaiting Disbursement
              </div>
              <div className="text-xs text-gray-500">
                Loan will start counting after disbursement
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loan Details Modal Component - Mobile Optimized
function LoanDetailsModal({ loan, onClose, showBalance }) {
  const calculated = loan.calculated;
  const status = loan.status || 'pending';
  const loanProduct = loan.loan_product_details;
  const isDisbursed = status === 'disbursed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Loan Details</h2>
            <p className="text-gray-500 text-xs sm:text-sm">Loan #{loan.id || 'N/A'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <FaTimesCircle size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Banner */}
          {isDisbursed && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaRocket className="text-purple-600 flex-shrink-0" size={20} />
                <div className="text-sm text-purple-800">
                  <strong>Loan Active:</strong> This loan has been disbursed and the repayment period has started.
                  {calculated?.remainingDays > 0 ? ` ${calculated.remainingDays} days remaining.` : ' Payment is due now.'}
                </div>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <div className="text-sm text-green-800">
                  <strong>Loan Approved:</strong> Your loan has been approved and is awaiting disbursement.
                  The repayment period will start once the loan is disbursed to your account.
                </div>
              </div>
            </div>
          )}

          {/* Status and Basic Info - Mobile Stacked */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <FaMoneyCheckAlt className="text-[var(--cred-teal)]" size={16} />
                Loan Information
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <InfoRow label="Status" value={status} status={status} />
                <InfoRow label="Product" value={loanProduct?.name || 'N/A'} />
                <InfoRow label="Amount" value={showBalance ? `$${parseFloat(loan.amount || 0).toLocaleString()}` : '●●●●'} />
                <InfoRow label="Duration" value={`${loan.duration_days || 'N/A'} days`} />
                <InfoRow label="Applied Date" value={loan.created_at ? new Date(loan.created_at).toLocaleDateString() : 'N/A'} />
                {isDisbursed && loan.disbursed_at && (
                  <InfoRow label="Disbursed Date" value={new Date(loan.disbursed_at).toLocaleDateString()} />
                )}
                {isDisbursed && calculated?.remainingDays > 0 && (
                  <InfoRow label="Due Date" value={`In ${calculated.remainingDays} days`} />
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <BsGraphUp className="text-[var(--cred-teal)]" size={16} />
                Financial Summary
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <InfoRow label="Principal" value={showBalance ? `$${parseFloat(loan.amount || 0).toLocaleString()}` : '●●●●'} />
                <InfoRow label={`Interest (${calculated?.interestRate || loanProduct?.interest_rate || '6'}%)`} value={showBalance ? `$${calculated?.interest || '0.00'}` : '●●●●'} />
                <InfoRow label="Total Repayment" value={showBalance ? `$${calculated?.totalRepayment || '0.00'}` : '●●●●'} />
                <InfoRow label="Daily Payment" value={showBalance ? `$${calculated?.dailyPayment || '0.00'}` : '●●●●'} />
                {isDisbursed && calculated?.remainingDays > 0 && (
                  <InfoRow label="Days Remaining" value={`${calculated.remainingDays} days`} />
                )}
                {!isDisbursed && (
                  <InfoRow label="Loan Status" value="Awaiting Disbursement" />
                )}
              </div>
            </div>
          </div>

          {/* Loan Product Details */}
          {loanProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <FiInfo className="text-blue-600" size={16} />
                Loan Product Details
              </h3>
              <div className="text-xs sm:text-sm text-blue-700 space-y-1">
                <p><strong>Name:</strong> {loanProduct.name}</p>
                <p><strong>Type:</strong> {loanProduct.loan_type}</p>
                <p><strong>Interest Rate:</strong> {loanProduct.interest_rate}%</p>
                <p><strong>Collateral:</strong> {loanProduct.collateral_required ? 'Required' : 'Not Required'}</p>
                {loanProduct.collateral_required && loanProduct.ltv_ratio && (
                  <p><strong>LTV Ratio:</strong> {loanProduct.ltv_ratio}%</p>
                )}
                {loanProduct.min_credit_score && (
                  <p><strong>Min Credit Score:</strong> {loanProduct.min_credit_score}</p>
                )}
              </div>
            </div>
          )}

          {/* Purpose */}
          {loan.purpose && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <FaFileInvoiceDollar className="text-[var(--cred-teal)]" size={16} />
                Loan Purpose
              </h3>
              <p className="text-gray-700 text-xs sm:text-sm">{loan.purpose}</p>
            </div>
          )}

          {/* Progress Bar ONLY for DISBURSED loans */}
          {isDisbursed && calculated && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <FaClock className="text-[var(--cred-teal)]" size={16} />
                Repayment Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(calculated.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div
                    className="bg-purple-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculated.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Disbursed</span>
                  <span>Due Date</span>
                </div>
              </div>
            </div>
          )}

          {/* Loan Terms */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <FiCreditCard className="text-green-600" size={16} />
              Loan Terms
            </h3>
            <ul className="text-xs sm:text-sm text-green-700 space-y-1">
              <li>• Interest rate: {calculated?.interestRate || loanProduct?.interest_rate || '6'}% per annum</li>
              <li>• Interest calculated pro-rata for loan duration</li>
              <li>• Daily repayment calculation shown for reference</li>
              <li>• Early repayment is allowed without penalty</li>
              {isDisbursed ? (
                <li>• <strong>Repayment period started on disbursement</strong></li>
              ) : (
                <li>• <strong>Repayment period starts after disbursement</strong></li>
              )}
              {loanProduct?.collateral_required && (
                <li>• Collateral requirement: {loanProduct.collateral_type || 'Required'}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, status }) {
  if (status) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-gray-600">{label}:</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
          {status === 'disbursed' && ' 🚀'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}:</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}

// Helper function for status colors
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'disbursed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'approved':
    case 'active':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
    case 'under_review':
    case 'submitted':
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rejected':
    case 'cancelled':
    case 'defaulted':
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'disbursed':
      return <FaRocket className="text-purple-500" size={14} />;
    case 'approved':
    case 'active':
    case 'completed':
      return <FaCheckCircle className="text-green-500" size={14} />;
    case 'pending':
    case 'under_review':
    case 'submitted':
    case 'draft':
      return <FaHourglassHalf className="text-yellow-500" size={14} />;
    case 'rejected':
    case 'cancelled':
    case 'defaulted':
    case 'canceled':
      return <FaTimesCircle className="text-red-500" size={14} />;
    default:
      return <FaHourglassHalf className="text-gray-500" size={14} />;
  }
}

// Add CSS for slide-up animation
const styles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}