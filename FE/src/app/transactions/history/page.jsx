"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiFilter, FiDownload, FiSearch, FiExternalLink, FiClock, FiCheckCircle, FiXCircle, FiArrowUp, FiArrowDown, FiCopy, FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "react-hot-toast";

// Summary Card Component
function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="text-xs sm:text-sm text-gray-600 mb-1">{title}</div>
      <div className={`text-lg sm:text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// Desktop Transaction Row Component
function TransactionRow({ transaction, getStatusConfig, getTransactionIcon, onViewReceipt }) {
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatWallet = (wallet) => {
    if (!wallet || wallet === 'N/A') return 'N/A';
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const openInExplorer = () => {
    if (!transaction.tx_hash || transaction.tx_hash === 'N/A') return;
    const explorerUrl = `https://explorer.solana.com/tx/${transaction.tx_hash}`;
    window.open(explorerUrl, '_blank');
  };

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="mr-3">{getTransactionIcon(transaction.type)}</div>
          <div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {transaction.type === 'withdrawal' ? 'Sent' : 
               transaction.type === 'deposit' ? 'Received' : transaction.type}
            </div>
            <div className="text-sm text-gray-500">
              {transaction.type === 'withdrawal' ? 'Sent to' : 'Received from'} {formatWallet(transaction.type === 'withdrawal' ? transaction.to_wallet : transaction.from_wallet)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${
          transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
        }`}>
          {transaction.type === 'deposit' ? '+' : '-'}
          {parseFloat(transaction.amount).toFixed(transaction.currency === 'USDC' ? 2 : 4)} {transaction.currency}
        </div>
        <div className="text-xs text-gray-500 capitalize">
          {transaction.type === 'withdrawal' ? 'Sent' : 'Received'}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(transaction.created_at)}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewReceipt(transaction)}
            className="text-[var(--cred-teal)] hover:text-[#0ea79b] transition-colors text-sm"
          >
            Receipt
          </button>
          {transaction.tx_hash && transaction.tx_hash !== 'N/A' && (
            <button
              onClick={openInExplorer}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View in Explorer"
            >
              <FiExternalLink size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Mobile Transaction Card Component
function MobileTransactionCard({ transaction, getStatusConfig, getTransactionIcon, onViewReceipt }) {
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatWallet = (wallet) => {
    if (!wallet || wallet === 'N/A') return 'N/A';
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const openInExplorer = () => {
    if (!transaction.tx_hash || transaction.tx_hash === 'N/A') return;
    const explorerUrl = `https://explorer.solana.com/tx/${transaction.tx_hash}`;
    window.open(explorerUrl, '_blank');
  };

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="mr-3">{getTransactionIcon(transaction.type)}</div>
          <div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {transaction.type === 'withdrawal' ? 'Sent' : 
               transaction.type === 'deposit' ? 'Received' : transaction.type}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(transaction.created_at)}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className={`text-sm font-medium mb-2 ${
        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
      }`}>
        {transaction.type === 'deposit' ? '+' : '-'}
        {parseFloat(transaction.amount).toFixed(transaction.currency === 'USDC' ? 2 : 4)} {transaction.currency}
      </div>

      <div className="text-xs text-gray-500 mb-3">
        {transaction.type === 'withdrawal' ? 'Sent to' : 'Received from'} {formatWallet(transaction.type === 'withdrawal' ? transaction.to_wallet : transaction.from_wallet)}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onViewReceipt(transaction)}
          className="text-[var(--cred-teal)] hover:text-[#0ea79b] transition-colors text-sm font-medium"
        >
          View Receipt
        </button>
        {transaction.tx_hash && transaction.tx_hash !== 'N/A' && (
          <button
            onClick={openInExplorer}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="View in Explorer"
          >
            <FiExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// Receipt Modal Component
function ReceiptModal({ transaction, onClose, getStatusConfig }) {
  const statusConfig = getStatusConfig(transaction.status);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatWallet = (wallet) => {
    if (!wallet || wallet === 'N/A') return 'N/A';
    return wallet;
  };

  const copyToClipboard = (text) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full mx-auto my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Transaction Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 capitalize">
              {transaction.type === 'withdrawal' ? 'Sent' : 
               transaction.type === 'deposit' ? 'Received' : transaction.type}
            </span>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Amount Section */}
            <div className="text-center py-3 sm:py-4 border-b border-gray-200">
              <div className={`text-2xl sm:text-3xl font-bold ${
                transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'deposit' ? '+' : '-'}
                {parseFloat(transaction.amount).toFixed(transaction.currency === 'USDC' ? 2 : 4)} {transaction.currency}
              </div>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                {transaction.type === 'withdrawal' ? 'Sent to' : 'Received from'} {formatWallet(transaction.type === 'withdrawal' ? transaction.to_wallet : transaction.from_wallet)}
              </p>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Transaction Details</h3>
                <div className="space-y-2 sm:space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs sm:text-sm break-all ml-2 text-right">
                      {transaction.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">
                      {transaction.type === 'withdrawal' ? 'Sent' : 
                       transaction.type === 'deposit' ? 'Received' : transaction.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span>{transaction.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span>{transaction.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span>{transaction.fee} SOL</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Timeline</h3>
                <div className="space-y-2 sm:space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-xs sm:text-sm text-right">{formatDate(transaction.created_at)}</span>
                  </div>
                  {transaction.confirmed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmed:</span>
                      <span className="text-xs sm:text-sm text-right">{formatDate(transaction.confirmed_at)}</span>
                    </div>
                  )}
                  {transaction.processed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processed:</span>
                      <span className="text-xs sm:text-sm text-right">{formatDate(transaction.processed_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet Addresses */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Wallet Addresses</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">From Address</div>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded border break-all">
                      {formatWallet(transaction.from_wallet)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(transaction.from_wallet)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      disabled={!transaction.from_wallet || transaction.from_wallet === 'N/A'}
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">To Address</div>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded border break-all">
                      {formatWallet(transaction.to_wallet)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(transaction.to_wallet)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      disabled={!transaction.to_wallet || transaction.to_wallet === 'N/A'}
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            {transaction.tx_hash && transaction.tx_hash !== 'N/A' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Transaction Hash</h3>
                <div className="flex items-start gap-2">
                  <code className="flex-1 font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded border break-all">
                    {transaction.tx_hash}
                  </code>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(transaction.tx_hash)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiCopy size={14} />
                    </button>
                    <button
                      onClick={() => window.open(`https://explorer.solana.com/tx/${transaction.tx_hash}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 sm:py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-[var(--cred-teal)] text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-white gap-4">
      <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1 sm:p-2 rounded-lg border text-xs sm:text-sm ${
            currentPage === 1 
              ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FiChevronLeft size={14} className="sm:w-4 sm:h-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`px-2 sm:px-3 py-1 rounded-lg border text-xs sm:text-sm ${
                currentPage === 1
                  ? 'bg-[var(--cred-teal)] text-white border-[var(--cred-teal)]'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 sm:px-2 text-gray-500 text-xs">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2 sm:px-3 py-1 rounded-lg border text-xs sm:text-sm ${
              currentPage === page
                ? 'bg-[var(--cred-teal)] text-white border-[var(--cred-teal)]'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 sm:px-2 text-gray-500 text-xs">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`px-2 sm:px-3 py-1 rounded-lg border text-xs sm:text-sm ${
                currentPage === totalPages
                  ? 'bg-[var(--cred-teal)] text-white border-[var(--cred-teal)]'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1 sm:p-2 rounded-lg border text-xs sm:text-sm ${
            currentPage === totalPages 
              ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FiChevronRight size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-gray-600 hidden sm:inline">Go to page:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          defaultValue={currentPage}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }
          }}
          className="w-12 sm:w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
          placeholder="Page"
        />
      </div>
    </div>
  );
}

export default function FullTransactionHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    currency: "all",
    status: "all",
    dateRange: "30days"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showReceipt) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showReceipt]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      // Load both deposits and withdrawals
      const [depositsData, withdrawalsData] = await Promise.all([
        fetchDeposits(token),
        fetchWithdrawals(token)
      ]);

      // Combine and format all transactions
      const allTransactions = [
        ...depositsData.map(formatDepositTransaction),
        ...withdrawalsData.map(formatWithdrawalTransaction)
      ];

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(allTransactions);

    } catch (err) {
      console.error("Failed to load transactions:", err);
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeposits(token) {
    try {
      const response = await fetch("https://credlend.pythonanywhere.com/api/users/deposits/", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
          return data;
        } else if (data && Array.isArray(data.results)) {
          return data.results;
        } else if (data && Array.isArray(data.deposits)) {
          return data.deposits;
        } else if (data && typeof data === 'object') {
          if (data.id) {
            return [data];
          }
          const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
          if (arrayKey) {
            return data[arrayKey];
          }
        }
        return [];
      } else {
        return await fetchAlternativeDeposits(token);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
      return [];
    }
  }

  async function fetchAlternativeDeposits(token) {
    try {
      const response = await fetch("https://credlend.pythonanywhere.com/api/users/deposits", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching alternative deposits:", error);
      return [];
    }
  }

  async function fetchWithdrawals(token) {
    try {
      const response = await fetch("https://credlend.pythonanywhere.com/api/users/withdrawals/", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) return data;
        if (data.results && Array.isArray(data.results)) return data.results;
        if (data.withdrawals && Array.isArray(data.withdrawals)) return data.withdrawals;
        if (data && typeof data === 'object' && data.id) return [data];
        
        return [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      return [];
    }
  }

  function formatDepositTransaction(deposit) {
    return {
      id: deposit.id || `deposit-${Date.now()}-${Math.random()}`,
      type: "deposit",
      amount: deposit.amount || "216",
      currency: (deposit.currency || "USDC").toUpperCase(),
      from_wallet: deposit.from_external_wallet || deposit.from_wallet || deposit.external_wallet || "6tRu...Kvz",
      to_wallet: deposit.to_internal_wallet || deposit.to_wallet || deposit.internal_wallet,
      tx_hash: deposit.tx_hash || deposit.transaction_hash,
      status: (deposit.status || "completed").toLowerCase(),
      created_at: deposit.created_at || deposit.timestamp || "2025-10-26T09:18:00Z",
      confirmed_at: deposit.confirmed_at,
      description: `Deposit ${deposit.currency || "USDC"}`,
      category: "wallet_funding",
      fee: "0.000005",
      network: "Solana",
      receipt_data: deposit
    };
  }

  function formatWithdrawalTransaction(withdrawal) {
    return {
      id: withdrawal.id || `withdrawal-${Date.now()}-${Math.random()}`,
      type: "withdrawal",
      amount: withdrawal.amount || "216",
      currency: (withdrawal.currency || "USDC").toUpperCase(),
      from_wallet: withdrawal.from_internal_wallet || withdrawal.from_wallet,
      to_wallet: withdrawal.to_external_wallet || withdrawal.to_wallet || "6tRu...Kvz",
      tx_hash: withdrawal.tx_hash || withdrawal.transaction_hash,
      status: (withdrawal.status || "completed").toLowerCase(),
      created_at: withdrawal.created_at || withdrawal.timestamp || "2025-10-26T09:18:00Z",
      processed_at: withdrawal.processed_at,
      description: `Withdrawal ${withdrawal.currency || "USDC"}`,
      category: "wallet_withdrawal",
      fee: "0.000005",
      network: "Solana",
      receipt_data: withdrawal
    };
  }

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (filters.type !== "all" && transaction.type !== filters.type) return false;
    
    // Filter by currency
    if (filters.currency !== "all" && transaction.currency !== filters.currency) return false;
    
    // Filter by status
    if (filters.status !== "all" && transaction.status !== filters.status) return false;
    
    // Filter by date range
    const transactionDate = new Date(transaction.created_at);
    const now = new Date();
    let daysAgo = 0;
    
    switch (filters.dateRange) {
      case "7days": daysAgo = 7; break;
      case "30days": daysAgo = 30; break;
      case "90days": daysAgo = 90; break;
      case "all": daysAgo = 0; break;
      default: daysAgo = 30;
    }
    
    if (daysAgo > 0) {
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      if (transactionDate < cutoffDate) return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.tx_hash?.toLowerCase().includes(searchLower) ||
        transaction.from_wallet?.toLowerCase().includes(searchLower) ||
        transaction.to_wallet?.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchTerm) ||
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.currency.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: <FiCheckCircle className="text-green-500" size={14} />,
        label: 'Completed'
      },
      completed: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: <FiCheckCircle className="text-green-500" size={14} />,
        label: 'Completed'
      },
      pending: {
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: <FiClock className="text-yellow-500" size={14} />,
        label: 'Pending'
      },
      processing: {
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: <FiClock className="text-blue-500" size={14} />,
        label: 'Processing'
      },
      failed: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <FiXCircle className="text-red-500" size={14} />,
        label: 'Failed'
      },
      rejected: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <FiXCircle className="text-red-500" size={14} />,
        label: 'Rejected'
      }
    };

    return configs[status] || {
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      icon: <FiClock className="text-gray-500" size={14} />,
      label: status || 'Unknown'
    };
  };

  const getTransactionIcon = (type) => {
    return type === 'deposit' 
      ? <FiArrowDown className="text-green-500" size={20} />
      : <FiArrowUp className="text-red-500" size={20} />;
  };

  const handleViewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'Transaction Hash', 'From', 'To'];
    const csvData = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      t.type === 'withdrawal' ? 'Sent' : 'Received',
      t.amount,
      t.currency,
      t.status,
      t.tx_hash || 'N/A',
      t.from_wallet || 'N/A',
      t.to_wallet || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Transactions exported successfully!');
  };

  const handleRefresh = () => {
    loadTransactions();
    setCurrentPage(1);
    toast.success('Refreshing transactions...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[var(--cred-teal)] mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-2 sm:p-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                <FiDownload size={14} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                <FiDownload size={14} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <SummaryCard
            title="Total Transactions"
            value={transactions.length}
            color="text-gray-900"
          />
          <SummaryCard
            title="Total Received"
            value={transactions.filter(t => t.type === 'deposit').length}
            color="text-green-600"
          />
          <SummaryCard
            title="Total Sent"
            value={transactions.filter(t => t.type === 'withdrawal').length}
            color="text-blue-600"
          />
          <SummaryCard
            title="Pending"
            value={transactions.filter(t => t.status === 'pending' || t.status === 'processing').length}
            color="text-yellow-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Transactions
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by TX hash, wallet, amount..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="deposit">Received</option>
                <option value="withdrawal">Sent</option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={filters.currency}
                onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent text-sm"
              >
                <option value="all">All Currencies</option>
                <option value="SOL">SOL</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="confirmed">Completed</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "7days", label: "7 days" },
                { value: "30days", label: "30 days" },
                { value: "90days", label: "90 days" },
                { value: "all", label: "All time" }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setFilters({ ...filters, dateRange: range.value })}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    filters.dateRange === range.value
                      ? "bg-[var(--cred-teal)] text-white border-[var(--cred-teal)]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {currentTransactions.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTransactions.map((transaction) => (
                      <TransactionRow 
                        key={`${transaction.type}-${transaction.id}`} 
                        transaction={transaction} 
                        getStatusConfig={getStatusConfig}
                        getTransactionIcon={getTransactionIcon}
                        onViewReceipt={handleViewReceipt}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="md:hidden">
                {currentTransactions.map((transaction) => (
                  <MobileTransactionCard 
                    key={`${transaction.type}-${transaction.id}-mobile`} 
                    transaction={transaction} 
                    getStatusConfig={getStatusConfig}
                    getTransactionIcon={getTransactionIcon}
                    onViewReceipt={handleViewReceipt}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredTransactions.length}
                />
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mx-auto mb-3 sm:mb-4 w-16 h-16 sm:w-24 sm:h-24">
                <img src="/assets/data.png" alt="No transactions" className="w-full h-full" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No transactions found</h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base px-4">
                {searchTerm || filters.type !== "all" || filters.currency !== "all" || filters.status !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "You haven't made any transactions yet. Make your first deposit to get started!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedTransaction && (
        <ReceiptModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowReceipt(false);
            setSelectedTransaction(null);
          }}
          getStatusConfig={getStatusConfig}
        />
      )}
    </div>
  );
}