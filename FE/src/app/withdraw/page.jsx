"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function WithdrawPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalInfo, setWithdrawalInfo] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    currency: "SOL",
  });

  const getAccessToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // Fetch withdrawal history and info
  useEffect(() => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      toast.error("Please log in to continue");
      router.push("/login");
      return;
    }

    fetchWithdrawalHistory(accessToken);
    fetchWithdrawalInfo(accessToken);
  }, [router]);

  const fetchWithdrawalHistory = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/withdrawals/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log("Withdrawal history response:", data);
        
        // Handle different response formats
        let withdrawalsArray = [];
        
        if (Array.isArray(data)) {
          withdrawalsArray = data;
        } else if (data && Array.isArray(data.results)) {
          withdrawalsArray = data.results;
        } else if (data && Array.isArray(data.withdrawals)) {
          withdrawalsArray = data.withdrawals;
        } else if (data && typeof data === 'object') {
          // Try to find any array in the object
          const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
          if (arrayKey) {
            withdrawalsArray = data[arrayKey];
          } else {
            // If it's a single withdrawal object, wrap it in array
            if (data.id) {
              withdrawalsArray = [data];
            }
          }
        }
        
        console.log("Processed withdrawals:", withdrawalsArray);
        setWithdrawals(withdrawalsArray);
      } else {
        console.log("Withdrawal history not available");
        setWithdrawals([]);
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      setWithdrawals([]);
    }
  };

  const fetchWithdrawalInfo = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/withdrawals/withdrawal_info/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setWithdrawalInfo(data);
      } else {
        // If the specific endpoint fails, try to get basic info from profile
        fetchBasicWithdrawalInfo(token);
      }
    } catch (error) {
      console.error("Error fetching withdrawal info:", error);
      fetchBasicWithdrawalInfo(token);
    }
  };

  const fetchBasicWithdrawalInfo = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/profile/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setWithdrawalInfo({
          internal_wallet: data.internal_wallet_address,
          external_wallet: data.external_wallet_address,
          available_balances: data.balance || {
            sol_balance: "0",
            usdc_balance: "0"
          }
        });
      }
    } catch (error) {
      console.error("Error fetching basic info:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      toast.error("You are not logged in.");
      router.push("/login");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if user has wallets connected
    if (!withdrawalInfo?.external_wallet) {
      toast.error("Please connect your external wallet first");
      router.push("/profile");
      return;
    }

    setLoading(true);
    try {
      // Try primary withdrawal endpoint first
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/withdrawals/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: amount.toString(),
            currency: formData.currency,
          }),
        }
      );

      const data = await res.json();
      console.log("Withdrawal response:", data);

      if (res.ok) {
        toast.success("Withdrawal request submitted successfully!");
        setFormData({ amount: "", currency: "SOL" });
        // Refresh data
        fetchWithdrawalHistory(accessToken);
        fetchWithdrawalInfo(accessToken);
      } else {
        // If primary fails, try alternative endpoint
        await tryAlternativeWithdrawal(accessToken, amount);
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to process withdrawal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tryAlternativeWithdrawal = async (token, amount) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/withdraw/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: amount.toString(),
            currency: formData.currency,
          }),
        }
      );

      const data = await res.json();
      console.log("Alternative withdrawal response:", data);

      if (res.ok) {
        toast.success("Withdrawal request submitted successfully!");
        setFormData({ amount: "", currency: "SOL" });
        fetchWithdrawalHistory(token);
        fetchWithdrawalInfo(token);
      } else {
        throw new Error(data.detail || data.error || "Withdrawal failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Safe withdrawals array
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdraw Funds</h1>
          <p className="text-gray-600">Withdraw your SOL or USDC to your external wallet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Withdrawal Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">New Withdrawal</h2>
              
              <form onSubmit={handleWithdrawal} className="space-y-6">
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, currency: "SOL" }))}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        formData.currency === "SOL" 
                          ? "border-teal-500 bg-teal-50 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900">SOL</div>
                      <div className="text-sm text-gray-600">Solana</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, currency: "USDC" }))}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        formData.currency === "USDC" 
                          ? "border-teal-500 bg-teal-50 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900">USDC</div>
                      <div className="text-sm text-gray-600">USD Coin</div>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="any"
                      min="0.000001"
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg p-4 pr-20 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-lg"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <span className="text-gray-500 font-medium">{formData.currency}</span>
                    </div>
                  </div>
                  {withdrawalInfo?.available_balances && (
                    <p className="text-sm text-gray-500 mt-2">
                      Available: <span className="font-semibold">
                        {withdrawalInfo.available_balances[`${formData.currency.toLowerCase()}_balance`] || "0"} {formData.currency}
                      </span>
                    </p>
                  )}
                </div>

                {/* Wallet Info */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Withdrawal Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">From Internal Wallet:</span>
                      <span className="font-mono text-gray-900 text-xs bg-white px-2 py-1 rounded border">
                        {withdrawalInfo?.internal_wallet ? 
                          `${withdrawalInfo.internal_wallet.slice(0, 8)}...${withdrawalInfo.internal_wallet.slice(-8)}` : 
                          'Not available'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">To External Wallet:</span>
                      <span className="font-mono text-gray-900 text-xs bg-white px-2 py-1 rounded border">
                        {withdrawalInfo?.external_wallet ? 
                          `${withdrawalInfo.external_wallet.slice(0, 8)}...${withdrawalInfo.external_wallet.slice(-8)}` : 
                          'Connect wallet first'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0 || !withdrawalInfo?.external_wallet}
                  className="w-full py-4 rounded-lg text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(180deg, #14B9B5 0%, #0ea79b 100%)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Withdrawal...
                    </span>
                  ) : (
                    "Withdraw Funds"
                  )}
                </button>

                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Withdrawals are processed manually and may take 1-24 hours. 
                        Minimum withdrawal: 0.000001 {formData.currency}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Withdrawal History</h2>
              
              {safeWithdrawals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-gray-500 mb-2">No withdrawals yet</div>
                  <div className="text-sm text-gray-400">Your withdrawal history will appear here</div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {safeWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-semibold text-gray-900 text-lg">
                            {withdrawal.amount} {withdrawal.currency}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status || 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-2">
                        <div className="flex justify-between">
                          <span>To:</span>
                          <span className="font-mono">
                            {withdrawal.to_external_wallet ? 
                              `${withdrawal.to_external_wallet.slice(0, 6)}...${withdrawal.to_external_wallet.slice(-6)}` : 
                              'External Wallet'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{formatDate(withdrawal.created_at)}</span>
                        </div>
                        {withdrawal.tx_hash && (
                          <div className="flex justify-between">
                            <span>Transaction:</span>
                            <span className="font-mono">{withdrawal.tx_hash.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}