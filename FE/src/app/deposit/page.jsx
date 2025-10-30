"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCopy, FiCheck, FiExternalLink, FiRefreshCw, FiClock } from "react-icons/fi";
import { FaQrcode, FaCheckCircle, FaReceipt } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function DepositPage() {
  const router = useRouter();
  const [walletInfo, setWalletInfo] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    loadAllData();
    
    // Start polling for new deposits and balance updates
    const interval = setInterval(() => {
      loadRecentDeposits();
      loadBalance();
      checkPendingDepositStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      await Promise.all([
        loadWalletInfo(),
        loadBalance(),
        loadRecentDeposits()
      ]);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWalletInfo() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Please log in first.");
        router.push("/login");
        return;
      }

      const response = await fetch(
        "https://credlend.pythonanywhere.com/api/users/deposits/platform_info/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data);
      } else if (response.status === 400) {
        const errorData = await response.json();
        toast.error(errorData.error || "Please connect a wallet first");
        router.push("/wallet");
      } else {
        toast.error("Failed to load wallet information");
      }
    } catch (err) {
      console.error("Wallet info error:", err);
      toast.error("Failed to load wallet information");
    }
  }

  async function loadBalance() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(
        "https://credlend.pythonanywhere.com/api/users/balance/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const balanceData = await response.json();
        setBalance(balanceData);
      }
    } catch (err) {
      console.error("Balance load error:", err);
    }
  }

  async function loadRecentDeposits() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(
        "https://credlend.pythonanywhere.com/api/users/deposits/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const deposits = await response.json();
        const sortedDeposits = Array.isArray(deposits) 
          ? deposits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [];
        setRecentDeposits(sortedDeposits.slice(0, 5));

        // Check if there's a pending deposit
        const pending = sortedDeposits.find(d => d.status === 'pending');
        if (pending) {
          setPendingDeposit(pending);
        } else if (pendingDeposit) {
          // If pending deposit is no longer in the list, clear it
          setPendingDeposit(null);
        }
      }
    } catch (err) {
      console.error("Failed to load deposits:", err);
    }
  }

  async function checkPendingDepositStatus() {
    if (!pendingDeposit) return;

    setCheckingStatus(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://credlend.pythonanywhere.com/api/users/deposits/${pendingDeposit.id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const updatedDeposit = await response.json();
        if (updatedDeposit.status === 'confirmed') {
          setPendingDeposit(null);
          toast.success("Deposit confirmed! Your funds are now available.");
          loadBalance(); // Refresh balance
        }
      }
    } catch (err) {
      console.error("Failed to check deposit status:", err);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function createDepositRecord(txHash, amount, currency) {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://credlend.pythonanywhere.com/api/users/deposits/",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tx_hash: txHash,
            amount: amount,
            currency: currency
          }),
        }
      );

      if (response.ok) {
        const newDeposit = await response.json();
        setPendingDeposit(newDeposit);
        toast.success("Deposit submitted for review! Please wait for confirmation.");
        loadRecentDeposits();
        return newDeposit;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to record deposit");
        return null;
      }
    } catch (err) {
      toast.error("Failed to record deposit");
      return null;
    }
  }

  async function copyWalletAddress() {
    if (!walletInfo?.internal_wallet_address) {
      toast.error("No wallet address available");
      return;
    }

    try {
      await navigator.clipboard.writeText(walletInfo.internal_wallet_address);
      setCopied(true);
      toast.success("Wallet address copied to clipboard!");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  }

  function openInExplorer() {
    if (!walletInfo?.internal_wallet_address) return;
    
    const explorerUrl = `https://explorer.solana.com/address/${walletInfo.internal_wallet_address}`;
    window.open(explorerUrl, '_blank');
  }

  function viewReceipt(deposit) {
    // Navigate to transaction history with receipt view
    router.push(`/transactions?receipt=${deposit.id}`);
  }

  function depositMoreFunds() {
    setPendingDeposit(null);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cred-teal)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet information...</p>
        </div>
      </div>
    );
  }

  if (!walletInfo?.internal_wallet_address) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Wallet Not Connected</h1>
            <p className="text-gray-600 mb-6">
              You need to connect a wallet before you can deposit funds.
            </p>
            <button
              onClick={() => router.push("/wallet")}
              className="w-full bg-[var(--cred-teal)] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show pending confirmation screen if there's a pending deposit
  if (pendingDeposit) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900">Deposit Processing</h1>
            <p className="text-gray-600 mt-2">Your deposit is being reviewed</p>
          </div>

          {/* Pending Confirmation Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClock className="text-yellow-600 text-3xl" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Confirmation Pending
            </h2>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your deposit of <strong>{pendingDeposit.amount} {pendingDeposit.currency}</strong> is under review. 
              Please wait while we verify your transaction.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-yellow-800 mb-2">
                <FiClock size={16} />
                <span className="font-medium">Estimated Time: 1-8 hours</span>
              </div>
              <p className="text-yellow-700 text-sm">
                Our team is reviewing your deposit. You'll receive a notification once it's confirmed.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{pendingDeposit.amount} {pendingDeposit.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Hash:</span>
                  <span className="font-mono text-gray-800">
                    {pendingDeposit.tx_hash ? `${pendingDeposit.tx_hash.slice(0, 8)}...${pendingDeposit.tx_hash.slice(-8)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Under Review
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="text-gray-800">
                    {new Date(pendingDeposit.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => viewReceipt(pendingDeposit)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaReceipt size={16} />
                View Receipt
              </button>
              <button
                onClick={depositMoreFunds}
                className="flex-1 bg-[var(--cred-teal)] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Deposit More Funds
              </button>
            </div>

            {/* Auto-check status */}
            {checkingStatus && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--cred-teal)]"></div>
                Checking status...
              </div>
            )}
          </div>

          {/* Recent Deposits (still show recent activity) */}
          <div className="mt-8">
            <RecentDepositsSection 
              recentDeposits={recentDeposits} 
              onViewReceipt={viewReceipt}
              onRefresh={loadRecentDeposits}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-3xl font-bold text-gray-900">Deposit Funds</h1>
          <p className="text-gray-600 mt-2">Add SOL or USDC to your CredLend account</p>
        </div>

        {/* Current Balance */}
        {balance && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Balance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {parseFloat(balance.sol_balance).toFixed(4)}
                </div>
                <div className="text-gray-600 text-sm">SOL</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {parseFloat(balance.usdc_balance).toFixed(2)}
                </div>
                <div className="text-gray-600 text-sm">USDC</div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Address Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Deposit Address</h2>
            <button
              onClick={() => setShowQr(!showQr)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <FaQrcode size={16} />
              {showQr ? "Hide QR" : "Show QR"}
            </button>
          </div>

          {/* QR Code */}
          {showQr && walletInfo?.internal_wallet_address && (
            <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-center text-sm text-gray-500">
                  QR Code would be generated for: {walletInfo.internal_wallet_address}
                </div>
              </div>
            </div>
          )}

          {/* Wallet Address */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all">
                {walletInfo?.internal_wallet_address}
              </code>
              <button
                onClick={copyWalletAddress}
                className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              >
                {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={copyWalletAddress}
              className="flex-1 bg-[var(--cred-teal)] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {copied ? "Copied!" : "Copy Address"}
            </button>
            <button
              onClick={openInExplorer}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiExternalLink size={16} />
              Explorer
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Deposit</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[var(--cred-teal)] text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Copy your deposit address</p>
                <p className="text-gray-600 text-sm mt-1">
                  Use the button above to copy your unique Solana address
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[var(--cred-teal)] text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Send SOL or USDC</p>
                <p className="text-gray-600 text-sm mt-1">
                  From your external wallet (like Phantom), send SOL or USDC to this address
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[var(--cred-teal)] text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Wait for confirmation</p>
                <p className="text-gray-600 text-sm mt-1">
                  Our team will review your deposit within 1-8 hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Deposit Entry Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Already Sent Funds?
          </h3>
          <p className="text-gray-600 mb-4">
            If you've already sent funds but don't see them, enter your transaction details below.
          </p>
          
          <ManualDepositForm onCreateDeposit={createDepositRecord} />
        </div>

        {/* Recent Deposits */}
        <RecentDepositsSection 
          recentDeposits={recentDeposits} 
          onViewReceipt={viewReceipt}
          onRefresh={loadRecentDeposits}
        />

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Only send SOL or USDC to this address</li>
            <li>• Sending other tokens may result in permanent loss</li>
            <li>• Minimum deposit: 0.001 SOL or 0.1 USDC</li>
            <li>• Double-check the address before sending</li>
            <li>• Deposits require manual review and may take 1-8 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Manual Deposit Form Component
function ManualDepositForm({ onCreateDeposit }) {
  const [formData, setFormData] = useState({
    txHash: "",
    amount: "",
    currency: "SOL"
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onCreateDeposit(formData.txHash, parseFloat(formData.amount), formData.currency);
      setFormData({ txHash: "", amount: "", currency: "SOL" });
    } catch (err) {
      toast.error("Failed to submit deposit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Transaction Hash
        </label>
        <input
          type="text"
          value={formData.txHash}
          onChange={(e) => setFormData({ ...formData, txHash: e.target.value })}
          placeholder="Enter transaction hash from your wallet"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.000001"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent"
          >
            <option value="SOL">SOL</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[var(--cred-teal)] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit for Review"}
      </button>
    </form>
  );
}

// Recent Deposits Section Component
function RecentDepositsSection({ recentDeposits, onViewReceipt, onRefresh }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Deposits</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {recentDeposits.length > 0 ? (
        <div className="space-y-3">
          {recentDeposits.map((deposit) => (
            <DepositItem 
              key={deposit.id} 
              deposit={deposit} 
              onViewReceipt={onViewReceipt}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No recent deposits found. Send SOL or USDC to your address above.
        </p>
      )}
    </div>
  );
}

// Deposit Item Component
function DepositItem({ deposit, onViewReceipt }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': 
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': 
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': 
        return 'text-red-600 bg-red-50 border-red-200';
      default: 
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': 
        return <FaCheckCircle className="text-green-500" size={16} />;
      case 'pending': 
        return <FiClock className="text-yellow-500" size={16} />;
      default: 
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{parseFloat(deposit.amount).toFixed(4)} {deposit.currency}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(deposit.status)}`}>
            {getStatusIcon(deposit.status)}
            {deposit.status}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(deposit.created_at)}
          {deposit.tx_hash && ` • TX: ${deposit.tx_hash.slice(0, 8)}...`}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {deposit.status === 'confirmed' && (
          <button
            onClick={() => onViewReceipt(deposit)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Receipt"
          >
            <FaReceipt size={14} />
            Receipt
          </button>
        )}
        
        {deposit.tx_hash && (
          <button
            onClick={() => window.open(`https://explorer.solana.com/tx/${deposit.tx_hash}`, '_blank')}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            title="View in Explorer"
          >
            <FiExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
}