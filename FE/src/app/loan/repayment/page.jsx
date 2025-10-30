"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { 
  FaMoneyCheckAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaHistory,
  FaArrowRight,
  FaWallet,
  FaRocket
} from "react-icons/fa";
import { 
  FiArrowLeft, 
  FiEye, 
  FiCalendar,
  FiCreditCard,
  FiTrendingUp,
  FiAlertCircle
} from "react-icons/fi";

export default function LoanRepaymentPage() {
  const router = useRouter();
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'overdue', 'all'
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in to view repayments.");
      router.push("/login");
      return;
    }
    fetchRepayments(token);
  }, [activeTab]);

  async function fetchRepayments(token) {
    try {
      setLoading(true);
      let endpoint = "https://credlend.pythonanywhere.com/api/loans/repayments/";
      
      if (activeTab === 'upcoming') {
        endpoint += "upcoming/";
      } else if (activeTab === 'overdue') {
        endpoint += "overdue/";
      }
      // 'all' uses the base endpoint

      const res = await fetch(endpoint, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) throw new Error("Failed to fetch repayments");

      const data = await res.json();
      console.log("Repayments response:", data);

      let repaymentData = [];
      if (Array.isArray(data)) {
        repaymentData = data;
      } else if (Array.isArray(data.results)) {
        repaymentData = data.results;
      } else if (Array.isArray(data.repayments)) {
        repaymentData = data.repayments;
      } else {
        console.warn("⚠️ Unexpected repayment data format:", data);
      }

      // Enhance repayment data with loan status information
      const enhancedRepayments = await enhanceRepaymentsWithLoanStatus(repaymentData, token);
      setRepayments(enhancedRepayments);
    } catch (err) {
      console.error("Repayment fetch error:", err);
      toast.error("Could not load your repayments");
    } finally {
      setLoading(false);
    }
  }

  // Fetch additional loan information to check for disbursed status
  async function enhanceRepaymentsWithLoanStatus(repaymentsData, token) {
    try {
      // First, get all user loans to check statuses
      const loansRes = await fetch(
        "https://credlend.pythonanywhere.com/api/loans/applications/",
        {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (loansRes.ok) {
        const loansData = await loansRes.json();
        let userLoans = [];
        
        if (Array.isArray(loansData)) {
          userLoans = loansData;
        } else if (Array.isArray(loansData.results)) {
          userLoans = loansData.results;
        } else if (Array.isArray(loansData.loans)) {
          userLoans = loansData.loans;
        }

        // Enhance each repayment with loan application status
        return repaymentsData.map(repayment => {
          const loanApplication = userLoans.find(loan => 
            loan.id === repayment.loan?.application?.id || 
            loan.loan?.application?.id === repayment.loan?.application?.id
          );
          
          return {
            ...repayment,
            loan_application_status: loanApplication?.status || 'unknown',
            is_disbursed: loanApplication?.status === 'disbursed'
          };
        });
      }
    } catch (error) {
      console.error("Error enhancing repayments with loan status:", error);
    }
    
    return repaymentsData;
  }

  async function handleRepaymentPayment(repaymentId) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in to make payments.");
      return;
    }

    setProcessingPayment(repaymentId);

    try {
      const res = await fetch(
        `https://credlend.pythonanywhere.com/api/loans/repayments/${repaymentId}/pay/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Payment processed successfully!");
        // Refresh repayments list
        fetchRepayments(token);
        
        // Show credit score update if available
        if (data.credit_score_updated) {
          toast.success(`Credit score updated: ${data.credit_score_updated}`);
        }
      } else {
        console.error("Payment failed:", data);
        toast.error(data?.error || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  }

  function getStatusIcon(status, isDisbursed = false) {
    if (isDisbursed) {
      return <FaRocket className="text-purple-500" size={16} />;
    }
    
    switch (status?.toLowerCase()) {
      case 'paid':
        return <FaCheckCircle className="text-green-500" size={16} />;
      case 'overdue':
        return <FaExclamationTriangle className="text-red-500" size={16} />;
      case 'pending':
        return <FaClock className="text-yellow-500" size={16} />;
      default:
        return <FaClock className="text-gray-500" size={16} />;
    }
  }

  function getStatusColor(status, isDisbursed = false) {
    if (isDisbursed) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function isOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Filter repayments based on active tab and disbursed status
  const filteredRepayments = repayments.filter(repayment => {
    const status = repayment.status || (repayment.paid_at ? 'paid' : 'pending');
    const isOverdueRepayment = status === 'overdue' || (repayment.due_date && new Date(repayment.due_date) < new Date() && !repayment.paid_at);
    
    // Include disbursed loans in all relevant tabs
    if (repayment.is_disbursed) {
      if (activeTab === 'upcoming') {
        return status === 'pending' && !isOverdueRepayment;
      } else if (activeTab === 'overdue') {
        return isOverdueRepayment;
      }
      return true; // Show in 'all' tab
    }
    
    // Regular filtering for non-disbursed loans
    if (activeTab === 'upcoming') {
      return status === 'pending' && !isOverdueRepayment;
    } else if (activeTab === 'overdue') {
      return isOverdueRepayment;
    }
    return true; // 'all' tab
  });

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
        Please wait while we securely retrieve your repayment data...
      </p>
    </div>
  );

  if (loading) return <Loader message="Loading your repayments..." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cred-teal)] to-[#0ea79b]/70 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <button
            onClick={() => router.push('/loan/dashboard')}
            className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors self-start"
          >
            <FiArrowLeft size={20} />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>
          
          <div className="text-center order-first sm:order-none">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Loan Repayments</h1>
            <p className="text-white/80 mt-1 text-xs sm:text-sm">
              Manage and track your loan repayments
            </p>
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              onClick={() => router.push("/loan/dashboard")}
              className="bg-white/20 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors text-xs sm:text-sm"
            >
              View Loans
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Total Repayments"
            value={repayments.length}
            icon={<FaHistory className="text-blue-500" size={16} />}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={repayments.filter(r => (r.status === 'pending' && !isOverdue(r.due_date)) || r.is_disbursed).length}
            icon={<FaClock className="text-yellow-500" size={16} />}
            color="yellow"
          />
          <StatCard
            title="Overdue"
            value={repayments.filter(r => r.status === 'overdue' || isOverdue(r.due_date)).length}
            icon={<FaExclamationTriangle className="text-red-500" size={16} />}
            color="red"
          />
          <StatCard
            title="Total Paid"
            value={`$${repayments.filter(r => r.status === 'paid').reduce((sum, repayment) => sum + parseFloat(repayment.amount || 0), 0).toLocaleString()}`}
            icon={<FaCheckCircle className="text-green-500" size={16} />}
            color="green"
          />
        </div>

        {/* Disbursed Loans Info Banner */}
        {repayments.some(r => r.is_disbursed) && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaRocket className="text-purple-600 flex-shrink-0" size={20} />
              <div className="text-sm text-purple-800">
                <strong>Disbursed Loans:</strong> You have active loans that have been disbursed. 
                Repayment schedules are now available for these loans.
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200">
            <TabButton
              active={activeTab === 'upcoming'}
              onClick={() => setActiveTab('upcoming')}
              icon={<FaClock className="mr-2" size={14} />}
              label="Upcoming"
              count={filteredRepayments.filter(r => (r.status === 'pending' && !isOverdue(r.due_date)) || r.is_disbursed).length}
            />
            <TabButton
              active={activeTab === 'overdue'}
              onClick={() => setActiveTab('overdue')}
              icon={<FaExclamationTriangle className="mr-2" size={14} />}
              label="Overdue"
              count={filteredRepayments.filter(r => r.status === 'overdue' || isOverdue(r.due_date)).length}
            />
            <TabButton
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              icon={<FaHistory className="mr-2" size={14} />}
              label="All Repayments"
              count={filteredRepayments.length}
            />
          </div>
        </div>

        {/* Repayments List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6">
          {filteredRepayments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FaMoneyCheckAlt className="text-gray-300 text-4xl sm:text-6xl mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                {activeTab === 'upcoming' ? 'No Upcoming Repayments' : 
                 activeTab === 'overdue' ? 'No Overdue Repayments' : 'No Repayments Found'}
              </h3>
              <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
                {activeTab === 'upcoming' ? 'You have no upcoming repayments at the moment.' :
                 activeTab === 'overdue' ? 'Great! You have no overdue repayments.' :
                 'You haven\'t made any repayments yet.'}
              </p>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="bg-[var(--cred-teal)] text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
                >
                  View All Repayments
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRepayments.map((repayment, index) => (
                <RepaymentCard
                  key={repayment.id || index}
                  repayment={repayment}
                  onPay={() => handleRepaymentPayment(repayment.id)}
                  processing={processingPayment === repayment.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
              <h3 className="font-semibold mb-2">Repayment Information</h3>
              <ul className="space-y-1">
                <li>• <strong>Disbursed Loans:</strong> Loans marked as "Disbursed" are active and ready for repayment</li>
                <li>• Payments are processed automatically on the Solana blockchain</li>
                <li>• On-time payments positively impact your credit score</li>
                <li>• Late payments may affect your credit rating</li>
                <li>• You can make early payments without penalties</li>
                <li>• Transaction fees are included in the payment amount</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
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

// Tab Button Component
function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium rounded-t-lg transition-colors ${
        active
          ? 'bg-white text-[var(--cred-teal)] border-t border-l border-r border-gray-200'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
          active ? 'bg-[var(--cred-teal)] text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// Repayment Card Component
function RepaymentCard({ repayment, onPay, processing }) {
  const status = repayment.status || (repayment.paid_at ? 'paid' : 'pending');
  const isOverdueRepayment = status === 'overdue' || (repayment.due_date && new Date(repayment.due_date) < new Date() && !repayment.paid_at);
  const daysUntilDue = getDaysUntilDue(repayment.due_date);
  const isDisbursed = repayment.is_disbursed;

  function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  return (
    <div className={`border rounded-lg sm:rounded-xl p-4 sm:p-6 transition-all ${
      isOverdueRepayment 
        ? 'bg-red-50 border-red-200' 
        : status === 'paid'
        ? 'bg-green-50 border-green-200'
        : isDisbursed
        ? 'bg-purple-50 border-purple-200'
        : 'bg-white border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section - Repayment Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon(status, isDisbursed)}
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(status, isDisbursed)}`}>
              {isDisbursed ? 'Disbursed' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {repayment.loan_details && (
              <span className="text-sm text-gray-600">
                Loan #{repayment.loan_details.id}
              </span>
            )}
            {isDisbursed && (
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Active Loan
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-gray-500 text-sm">Amount</div>
              <div className="font-semibold text-gray-800 text-lg">
                ${parseFloat(repayment.amount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Due Date</div>
              <div className="font-semibold text-gray-800">
                {formatDate(repayment.due_date)}
              </div>
              {daysUntilDue !== null && (status === 'pending' || isDisbursed) && (
                <div className={`text-xs ${isOverdueRepayment ? 'text-red-600' : 'text-gray-500'}`}>
                  {isOverdueRepayment ? `${Math.abs(daysUntilDue)} days overdue` : `Due in ${daysUntilDue} days`}
                </div>
              )}
            </div>
            {repayment.paid_at && (
              <div>
                <div className="text-gray-500 text-sm">Paid Date</div>
                <div className="font-semibold text-gray-800">
                  {formatDate(repayment.paid_at)}
                </div>
              </div>
            )}
            {repayment.loan_details && (
              <div>
                <div className="text-gray-500 text-sm">Interest Rate</div>
                <div className="font-semibold text-gray-800">
                  {repayment.loan_details.interest_rate}%
                </div>
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          {repayment.tx_hash && (
            <div className="flex items-center gap-2 text-sm">
              <FaWallet className="text-gray-400" size={14} />
              <span className="text-gray-600">Transaction:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                {repayment.tx_hash.slice(0, 8)}...{repayment.tx_hash.slice(-8)}
              </code>
            </div>
          )}

          {/* Disbursement Info */}
          {isDisbursed && !repayment.paid_at && (
            <div className="flex items-center gap-2 text-sm text-purple-600 mt-2">
              <FaRocket size={12} />
              <span>This repayment is for a disbursed loan. Funds are available in your wallet.</span>
            </div>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
          {status === 'paid' ? (
            <div className="flex items-center gap-2 text-green-600">
              <FaCheckCircle size={16} />
              <span className="font-semibold">Payment Completed</span>
            </div>
          ) : (
            <button
              onClick={onPay}
              disabled={processing}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                isOverdueRepayment
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isDisbursed
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-[var(--cred-teal)] hover:opacity-90 text-white'
              } ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaDollarSign size={14} />
                  Pay Now
                  <FaArrowRight size={12} />
                </>
              )}
            </button>
          )}

          {repayment.loan_details && (
            <div className="text-center text-sm text-gray-600">
              Principal: ${parseFloat(repayment.loan_details.principal || 0).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Loan Details */}
      {repayment.loan_details && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Due:</span>
              <span className="font-semibold text-gray-800 ml-2">
                ${parseFloat(repayment.loan_details.total_due || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Amount Repaid:</span>
              <span className="font-semibold text-gray-800 ml-2">
                ${parseFloat(repayment.loan_details.amount_repaid || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <span className="font-semibold text-gray-800 ml-2">
                ${(parseFloat(repayment.loan_details.total_due || 0) - parseFloat(repayment.loan_details.amount_repaid || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusIcon(status, isDisbursed = false) {
  if (isDisbursed) {
    return <FaRocket className="text-purple-500" size={16} />;
  }
  
  switch (status?.toLowerCase()) {
    case 'paid':
      return <FaCheckCircle className="text-green-500" size={16} />;
    case 'overdue':
      return <FaExclamationTriangle className="text-red-500" size={16} />;
    case 'pending':
      return <FaClock className="text-yellow-500" size={16} />;
    default:
      return <FaClock className="text-gray-500" size={16} />;
  }
}

function getStatusColor(status, isDisbursed = false) {
  if (isDisbursed) {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
