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
  FaRocket,
  FaPercent
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
  const [activeTab, setActiveTab] = useState('all'); // 'upcoming', 'overdue', 'all'
  const [processingPayment, setProcessingPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState(null);

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

        return repaymentsData.map(repayment => {
          const loanApplication = userLoans.find(loan => 
            loan.id === repayment.loan?.application?.id || 
            loan.loan?.application?.id === repayment.loan?.application?.id
          );
          
          return {
            ...repayment,
            loan_application_status: loanApplication?.status || 'unknown',
            is_disbursed: loanApplication?.status === 'disbursed',
            // Calculate remaining amount for display
            display_remaining: repayment.remaining_amount || (repayment.amount - (repayment.amount_paid || 0))
          };
        });
      }
    } catch (error) {
      console.error("Error enhancing repayments with loan status:", error);
    }
    
    return repaymentsData;
  }

  async function handleRepaymentPayment(repaymentId, amount = null) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please log in to make payments.");
      return;
    }

    setProcessingPayment(repaymentId);

    try {
      const paymentData = {};
      if (amount !== null) {
        paymentData.amount = amount;
      }

      const res = await fetch(
        `https://credlend.pythonanywhere.com/api/loans/repayments/${repaymentId}/pay/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (data.status === 'partial') {
          toast.success(`✅ Partial payment of $${data.amount_paid} processed!`);
          toast.info(`Remaining: $${data.remaining_amount}`);
        } else {
          toast.success("✅ Payment completed successfully!");
        }
        
        // Refresh repayments list
        fetchRepayments(token);
        
        // Show credit score update if available
        if (data.credit_score_updated) {
          toast.success(`Credit score updated: ${data.credit_score_updated}`);
        }
        
        // Close modal if open
        setShowPaymentModal(false);
        setSelectedRepayment(null);
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

  function openPaymentModal(repayment, presetAmount = null) {
    setSelectedRepayment(repayment);
    const remaining = repayment.display_remaining || repayment.remaining_amount || (repayment.amount - (repayment.amount_paid || 0));
    setPaymentAmount(prev => ({
      ...prev,
      [repayment.id]: presetAmount || remaining
    }));
    setShowPaymentModal(true);
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
      case 'partial':
        return <FaPercent className="text-blue-500" size={16} />;
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
      case 'partial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  // Filter repayments based on active tab
  const filteredRepayments = repayments.filter(repayment => {
    const status = repayment.status || (repayment.paid_at ? 'paid' : 'pending');
    const isOverdueRepayment = status === 'overdue' || (repayment.due_date && new Date(repayment.due_date) < new Date() && !repayment.paid_at);
    
    if (activeTab === 'upcoming') {
      return status === 'pending' && !isOverdueRepayment;
    } else if (activeTab === 'overdue') {
      return isOverdueRepayment;
    }
    return true; // 'all' tab
  });

  // Calculate statistics
  const totalRepayments = repayments.length;
  const pendingRepayments = repayments.filter(r => r.status === 'pending' && !isOverdue(r.due_date)).length;
  const overdueRepayments = repayments.filter(r => r.status === 'overdue' || isOverdue(r.due_date)).length;
  const totalPaid = repayments.filter(r => r.status === 'paid').reduce((sum, repayment) => sum + parseFloat(repayment.amount_paid || 0), 0);
  const disbursedRepayments = repayments.filter(r => r.is_disbursed && !r.paid_at).length;

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
        {/* Header */}
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Total Repayments"
            value={totalRepayments}
            icon={<FaHistory className="text-blue-500" size={16} />}
            color="blue"
          />
          <StatCard
            title="Active"
            value={disbursedRepayments}
            icon={<FaRocket className="text-purple-500" size={16} />}
            color="purple"
          />
          <StatCard
            title="Pending"
            value={pendingRepayments}
            icon={<FaClock className="text-yellow-500" size={16} />}
            color="yellow"
          />
          <StatCard
            title="Overdue"
            value={overdueRepayments}
            icon={<FaExclamationTriangle className="text-red-500" size={16} />}
            color="red"
          />
          <StatCard
            title="Total Paid"
            value={`$${totalPaid.toLocaleString()}`}
            icon={<FaCheckCircle className="text-green-500" size={16} />}
            color="green"
          />
        </div>

        {/* Disbursed Loans Info Banner */}
        {disbursedRepayments > 0 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FaRocket className="text-purple-600 flex-shrink-0" size={20} />
              <div className="text-sm text-purple-800">
                <strong>Active Loans:</strong> You have {disbursedRepayments} disbursed loan(s) ready for repayment. 
                You can make full or partial payments at any time.
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200">
            <TabButton
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              icon={<FaHistory className="mr-2" size={14} />}
              label="All Repayments"
              count={filteredRepayments.length}
            />
            <TabButton
              active={activeTab === 'upcoming'}
              onClick={() => setActiveTab('upcoming')}
              icon={<FaClock className="mr-2" size={14} />}
              label="Upcoming"
              count={pendingRepayments}
            />
            <TabButton
              active={activeTab === 'overdue'}
              onClick={() => setActiveTab('overdue')}
              icon={<FaExclamationTriangle className="mr-2" size={14} />}
              label="Overdue"
              count={overdueRepayments}
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
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRepayments.map((repayment, index) => (
                <RepaymentCard
                  key={repayment.id || index}
                  repayment={repayment}
                  onPay={(amount) => handleRepaymentPayment(repayment.id, amount)}
                  onOpenModal={(presetAmount) => openPaymentModal(repayment, presetAmount)}
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
                <li>• <strong>Flexible Payments:</strong> Make full or partial payments anytime after disbursement</li>
                <li>• <strong>Active Loans:</strong> Loans marked with 🚀 are disbursed and ready for repayment</li>
                <li>• Payments are processed automatically on the Solana blockchain</li>
                <li>• On-time payments positively impact your credit score</li>
                <li>• You can make early payments without penalties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRepayment && (
        <PaymentModal
          repayment={selectedRepayment}
          paymentAmount={paymentAmount[selectedRepayment.id] || selectedRepayment.display_remaining}
          onAmountChange={(amount) => setPaymentAmount(prev => ({
            ...prev,
            [selectedRepayment.id]: amount
          }))}
          onPay={(amount) => handleRepaymentPayment(selectedRepayment.id, amount)}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedRepayment(null);
          }}
          processing={processingPayment === selectedRepayment.id}
        />
      )}
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
function RepaymentCard({ repayment, onPay, onOpenModal, processing }) {
  const status = repayment.status || (repayment.paid_at ? 'paid' : (repayment.amount_paid > 0 ? 'partial' : 'pending'));
  const isOverdueRepayment = status === 'overdue' || (repayment.due_date && new Date(repayment.due_date) < new Date() && !repayment.paid_at);
  const daysUntilDue = getDaysUntilDue(repayment.due_date);
  const isDisbursed = repayment.is_disbursed;
  const remainingAmount = repayment.display_remaining || repayment.remaining_amount || (repayment.amount - (repayment.amount_paid || 0));
  const paymentProgress = repayment.payment_progress || (repayment.amount_paid / repayment.amount) * 100;

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
              {isDisbursed ? 'Active 🚀' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'partial' && ` (${Math.round(paymentProgress)}%)`}
            </span>
            {repayment.loan_details && (
              <span className="text-sm text-gray-600">
                Loan #{repayment.loan_details.id}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-gray-500 text-sm">Total Due</div>
              <div className="font-semibold text-gray-800 text-lg">
                ${parseFloat(repayment.amount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Due Date</div>
              <div className="font-semibold text-gray-800">
                {formatDate(repayment.due_date)}
              </div>
              {daysUntilDue !== null && status !== 'paid' && (
                <div className={`text-xs ${isOverdueRepayment ? 'text-red-600' : 'text-gray-500'}`}>
                  {isOverdueRepayment ? `${Math.abs(daysUntilDue)} days overdue` : `Due in ${daysUntilDue} days`}
                </div>
              )}
            </div>
            <div>
              <div className="text-gray-500 text-sm">Paid</div>
              <div className="font-semibold text-green-600">
                ${parseFloat(repayment.amount_paid || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Remaining</div>
              <div className="font-semibold text-blue-600">
                ${parseFloat(remainingAmount).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {status !== 'paid' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Payment Progress</span>
                <span>{Math.round(paymentProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${paymentProgress}%` }}
                ></div>
              </div>
            </div>
          )}

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
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
          {status === 'paid' ? (
            <div className="flex items-center gap-2 text-green-600">
              <FaCheckCircle size={16} />
              <span className="font-semibold">Fully Paid</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Full Payment Button */}
              <button
                onClick={() => onPay(remainingAmount)}
                disabled={processing || remainingAmount <= 0}
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
                    Pay Full ${parseFloat(remainingAmount).toLocaleString()}
                  </>
                )}
              </button>
              
              {/* Partial Payment Options */}
              {isDisbursed && remainingAmount > 0 && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onOpenModal()}
                    disabled={processing}
                    className="bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Custom Amount
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onPay(Math.min(100, remainingAmount))}
                      disabled={processing}
                      className="flex-1 bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      $100
                    </button>
                    <button
                      onClick={() => onPay(Math.min(500, remainingAmount))}
                      disabled={processing}
                      className="flex-1 bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      $500
                    </button>
                    <button
                      onClick={() => onPay(Math.min(1000, remainingAmount))}
                      disabled={processing}
                      className="flex-1 bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      $1K
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {repayment.loan_details && (
            <div className="text-center text-sm text-gray-600">
              Interest: {repayment.loan_details.interest_rate}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Payment Modal Component
function PaymentModal({ repayment, paymentAmount, onAmountChange, onPay, onClose, processing }) {
  const remainingAmount = repayment.display_remaining || repayment.remaining_amount || (repayment.amount - (repayment.amount_paid || 0));
  const maxAmount = Math.min(parseFloat(paymentAmount), remainingAmount);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Make Payment</h3>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Remaining Balance</div>
            <div className="text-2xl font-bold text-gray-800">${remainingAmount.toLocaleString()}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount ($)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              min="0.01"
              max={remainingAmount}
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] outline-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              Enter amount between $0.01 and ${remainingAmount.toLocaleString()}
            </div>
          </div>
          
          {paymentAmount > remainingAmount && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Payment amount cannot exceed remaining balance of ${remainingAmount.toLocaleString()}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onPay(parseFloat(paymentAmount))}
            disabled={processing || paymentAmount <= 0 || paymentAmount > remainingAmount}
            className="flex-1 bg-[var(--cred-teal)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              `Pay $${parseFloat(paymentAmount).toLocaleString()}`
            )}
          </button>
        </div>
      </div>
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
    case 'partial':
      return <FaPercent className="text-blue-500" size={16} />;
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
    case 'partial':
      return 'bg-blue-100 text-blue-800 border-blue-200';
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