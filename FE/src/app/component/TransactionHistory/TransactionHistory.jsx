"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiDownload, FiExternalLink, FiClock, FiCheckCircle, FiXCircle, FiArrowUp, FiArrowDown, FiCopy, FiArrowRight } from "react-icons/fi";
import { toast } from "react-hot-toast";

// Summary Card Component
function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// Transaction Row Component
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
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  const openInExplorer = () => {
    if (!transaction.tx_hash || transaction.tx_hash === 'N/A') return;
    const explorerUrl = `https://explorer.solana.com/tx/${transaction.tx_hash}`;
    window.open(explorerUrl, '_blank');
  };

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="mr-3">{getTransactionIcon(transaction.type)}</div>
          <div>
            <div className="text-sm font-medium text-gray-900 capitalize">
              {transaction.type}
            </div>
            <div className="text-sm text-gray-500">
              {transaction.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
          {transaction.transaction_type === 'credit' ? '+' : '-'}
          {parseFloat(transaction.amount).toFixed(transaction.currency === 'USDC' ? 2 : 4)} {transaction.currency}
        </div>
        <div className="text-xs text-gray-500 capitalize">
          {transaction.transaction_type}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">From:</span>
            {formatWallet(transaction.from_wallet)}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">To:</span>
            {formatWallet(transaction.to_wallet)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(transaction.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            <span className="text-sm text-gray-500 capitalize">{transaction.type}</span>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          {/* Amount Section */}
          <div className="text-center py-4 border-b border-gray-200">
            <div className={`text-3xl font-bold ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
              {transaction.transaction_type === 'credit' ? '+' : '-'}
              {parseFloat(transaction.amount).toFixed(transaction.currency === 'USDC' ? 2 : 4)} {transaction.currency}
            </div>
            <p className="text-gray-600 mt-2">{transaction.description}</p>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{transaction.type}</span>
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
              <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-sm">{formatDate(transaction.created_at)}</span>
                </div>
                {transaction.confirmed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmed:</span>
                    <span className="text-sm">{formatDate(transaction.confirmed_at)}</span>
                  </div>
                )}
                {transaction.processed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed:</span>
                    <span className="text-sm">{formatDate(transaction.processed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Addresses */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Wallet Addresses</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">From Address</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border break-all">
                    {formatWallet(transaction.from_wallet)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(transaction.from_wallet)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={!transaction.from_wallet || transaction.from_wallet === 'N/A'}
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">To Address</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border break-all">
                    {formatWallet(transaction.to_wallet)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(transaction.to_wallet)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={!transaction.to_wallet || transaction.to_wallet === 'N/A'}
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          {transaction.tx_hash && transaction.tx_hash !== 'N/A' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Transaction Hash</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border break-all">
                  {transaction.tx_hash}
                </code>
                <button
                  onClick={() => copyToClipboard(transaction.tx_hash)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiCopy size={16} />
                </button>
                <button
                  onClick={() => window.open(`https://explorer.solana.com/tx/${transaction.tx_hash}`, '_blank')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiExternalLink size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-[var(--cred-teal)] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Check if we should show a specific receipt from URL params
  useEffect(() => {
    const receiptId = searchParams.get('receipt');
    if (receiptId) {
      const transaction = transactions.find(t => t.id.toString() === receiptId);
      if (transaction) {
        setSelectedTransaction(transaction);
        setShowReceipt(true);
      }
    }
  }, [searchParams, transactions]);

  useEffect(() => {
    loadTransactions();
  }, []);

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
      transaction_type: "credit",
      amount: deposit.amount || "0",
      currency: (deposit.currency || "SOL").toUpperCase(),
      from_wallet: deposit.from_external_wallet || deposit.from_wallet || deposit.external_wallet,
      to_wallet: deposit.to_internal_wallet || deposit.to_wallet || deposit.internal_wallet,
      tx_hash: deposit.tx_hash || deposit.transaction_hash,
      status: (deposit.status || "pending").toLowerCase(),
      created_at: deposit.created_at || deposit.timestamp || new Date().toISOString(),
      confirmed_at: deposit.confirmed_at,
      description: `Deposit ${deposit.currency || "SOL"}`,
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
      transaction_type: "debit",
      amount: withdrawal.amount || "0",
      currency: (withdrawal.currency || "SOL").toUpperCase(),
      from_wallet: withdrawal.from_internal_wallet || withdrawal.from_wallet,
      to_wallet: withdrawal.to_external_wallet || withdrawal.to_wallet,
      tx_hash: withdrawal.tx_hash || withdrawal.transaction_hash,
      status: (withdrawal.status || "pending").toLowerCase(),
      created_at: withdrawal.created_at || withdrawal.timestamp || new Date().toISOString(),
      processed_at: withdrawal.processed_at,
      description: `Withdrawal ${withdrawal.currency || "SOL"}`,
      category: "wallet_withdrawal",
      fee: "0.000005",
      network: "Solana",
      receipt_data: withdrawal
    };
  }

  // Get only the last 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: <FiCheckCircle className="text-green-500" size={14} />,
        label: 'Confirmed'
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

  const handleViewMore = () => {
    router.push('/transactions/history');
  };

  const handleRefresh = () => {
    loadTransactions();
    toast.success('Refreshing transactions...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cred-teal)] mx-auto"></div>
          <p className="mt-4 text-[#0F9996]">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Recent Transactions</h1>
              <p className="text-gray-600 mt-2">
                {transactions.length > 0
                  ? `Showing ${recentTransactions.length} recent of ${transactions.length} total transactions`
                  : 'No transactions found'
                }
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiDownload size={16} />
                Refresh
              </button>
              {transactions.length > 5 && (
                <button
                  onClick={handleViewMore}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--cred-teal)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  View Full History
                  <FiArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid  grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Transactions"
            value={transactions.length}
            color="text-gray-900"
          />
          <SummaryCard
            title="Total Deposits"
            value={transactions.filter(t => t.type === 'deposit').length}
            color="text-green-600"
          />
          <SummaryCard
            title="Total Withdrawals"
            value={transactions.filter(t => t.type === 'withdrawal').length}
            color="text-blue-600"
          />
          <SummaryCard
            title="Pending"
            value={transactions.filter(t => t.status === 'pending' || t.status === 'processing').length}
            color="text-yellow-600"
          />
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From/To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
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
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <img src="/assets/data.png" alt="" className=" items-center flex w-50 h-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You haven't made any transactions yet. Make your first deposit to get started!
              </p>
            </div>
          )}
        </div>

        {/* View More Button for Mobile */}
        {transactions.length > 5 && (
          <div className="mt-6 text-center md:hidden">
            <button
              onClick={handleViewMore}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--cred-teal)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              View All {transactions.length} Transactions
              <FiArrowRight size={16} />
            </button>
          </div>
        )}
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