"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FiCopy, FiArrowUp, FiArrowDown, FiX } from "react-icons/fi";
import FullTransactionHistory from "../transactions/history/page";

export default function WalletPage() {
  const router = useRouter();
  const [currentState, setCurrentState] = useState("no-connection");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalWallet, setInternalWallet] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [converter, setConverter] = useState({
    fromAmount: "",
    toAmount: "",
    fromCurrency: "SOL",
    toCurrency: "USDC",
    exchangeRate: 184.24
  });
  const [transactions, setTransactions] = useState([]);

  const BASE_URL = "https://credlend.pythonanywhere.com/api/users";

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      checkExistingWallet(token);
    }
  }, []);

  const checkExistingWallet = async (token) => {
    try {
      const [walletRes, balanceRes] = await Promise.all([
        fetch(`${BASE_URL}/wallet/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/balance/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.has_internal_wallet && walletData.internal_wallet_address) {
          setInternalWallet({
            address: walletData.internal_wallet_address,
            type: "Internal Wallet"
          });
          setCurrentState("connected");
          loadBalanceData(token);
          loadTransactions(token);
        }
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalanceData(balanceData);
      }
    } catch (err) {
      console.error("Initial load error:", err);
    }
  };

  const loadBalanceData = async (token) => {
    try {
      const res = await fetch(`${BASE_URL}/balance/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalanceData(data);
      }
    } catch (err) {
      console.error("Balance load error:", err);
    }
  };

  const loadTransactions = async (token) => {
    try {
      const [depositsRes, withdrawalsRes] = await Promise.all([
        fetch(`${BASE_URL}/deposits/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/withdrawals/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      // Handle the API response properly
      const depositsData = depositsRes.ok ? await depositsRes.json() : null;
      const withdrawalsData = withdrawalsRes.ok ? await withdrawalsRes.json() : null;

      // Ensure deposits is always an array
      let deposits = [];
      if (depositsData) {
        if (Array.isArray(depositsData)) {
          deposits = depositsData;
        } else if (depositsData.results && Array.isArray(depositsData.results)) {
          deposits = depositsData.results;
        } else if (depositsData.deposits && Array.isArray(depositsData.deposits)) {
          deposits = depositsData.deposits;
        } else if (typeof depositsData === 'object' && depositsData.id) {
          deposits = [depositsData];
        }
      }

      // Ensure withdrawals is always an array
      let withdrawals = [];
      if (withdrawalsData) {
        if (Array.isArray(withdrawalsData)) {
          withdrawals = withdrawalsData;
        } else if (withdrawalsData.results && Array.isArray(withdrawalsData.results)) {
          withdrawals = withdrawalsData.results;
        } else if (withdrawalsData.withdrawals && Array.isArray(withdrawalsData.withdrawals)) {
          withdrawals = withdrawalsData.withdrawals;
        } else if (typeof withdrawalsData === 'object' && withdrawalsData.id) {
          withdrawals = [withdrawalsData];
        }
      }

      const allTransactions = [
        ...deposits.map(deposit => ({
          id: deposit.id,
          date: deposit.created_at || new Date().toISOString(),
          amount: `${deposit.amount || '0'} ${(deposit.currency || 'USDC').toUpperCase()}`,
          type: 'received',
          description: '↓ Received from'
        })),
        ...withdrawals.map(withdrawal => ({
          id: withdrawal.id,
          date: withdrawal.created_at || new Date().toISOString(),
          amount: `${withdrawal.amount || '0'} ${(withdrawal.currency || 'USDC').toUpperCase()}`,
          type: 'sent',
          description: '↑ Sent to'
        }))
      ];

      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions.slice(0, 5));
    } catch (err) {
      console.error("Transactions load error:", err);
      // Set empty arrays in case of error
      setTransactions([]);
    }
  };

  const handleConnectWallet = async () => {
    if (!walletAddress) {
      toast.error("Please enter wallet address");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/wallet/connect/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });

      const data = await res.json();
      console.log("Connect wallet response:", data);

      if (res.ok) {
        toast.success("Wallet connected successfully!");
        setCurrentState("processing");

        setTimeout(() => {
          setCurrentState("connected");
          checkExistingWallet(token);
        }, 3000);

      } else {
        toast.error(data.detail || data.error || "Failed to connect wallet");
      }
    } catch (err) {
      console.error("Connect wallet error:", err);
      toast.error("Network error while connecting");
    } finally {
      setLoading(false);
      setWalletAddress("");
      setSelectedWalletType(null);
      setShowWalletModal(false);
    }
  };

  const handleConverterChange = (field, value) => {
    setConverter(prev => {
      const newConverter = { ...prev, [field]: value };

      if (field === "fromAmount" && value && !isNaN(value)) {
        const amount = parseFloat(value);
        if (newConverter.fromCurrency === "SOL" && newConverter.toCurrency === "USDC") {
          newConverter.toAmount = (amount * newConverter.exchangeRate).toFixed(2);
        }
      } else if (field === "toAmount" && value && !isNaN(value)) {
        const amount = parseFloat(value);
        if (newConverter.fromCurrency === "SOL" && newConverter.toCurrency === "USDC") {
          newConverter.fromAmount = (amount / newConverter.exchangeRate).toFixed(6);
        }
      }

      return newConverter;
    });
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    toast.success("Copied to clipboard!");
  };

  const WalletModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4 sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-auto animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Connect Wallet</h3>
          <button
            onClick={() => {
              setShowWalletModal(false);
              setSelectedWalletType(null);
            }}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {!selectedWalletType ? (
          <div className="p-6">
            <p className="text-gray-600 text-center mb-6">
              Choose your preferred wallet to connect
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setSelectedWalletType("phantom")}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#00A79D] hover:bg-[#00A79D]/5 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <img
                      src="/assets/phantom.png"
                      alt="Phantom"
                      className="w-8 h-8"
                    />
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-[#00A79D]">
                    Phantom Wallet
                  </span>
                </div>
              </button>

              <button
                onClick={() => setSelectedWalletType("softlare")}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#00A79D] hover:bg-[#00A79D]/5 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <img
                      src="/assets/softlare.png"
                      alt="softlare"
                      className="w-8 h-8"
                    />
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-[#00A79D]">
                    Softlare Wallet
                  </span>
                </div>
              </button>
              <button
                onClick={() => setSelectedWalletType("metamask")}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#00A79D] hover:bg-[#00A79D]/5 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <img
                      src="/assets/metamask.png"
                      alt="metamask"
                      className="w-8 h-8"
                    />
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-[#00A79D]">
                    MetaMask Wallet
                  </span>
                </div>
              </button>
              <button
                onClick={() => setSelectedWalletType("trust wallet")}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#00A79D] hover:bg-[#00A79D]/5 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <img
                      src="/assets/trustwallet.png"
                      alt="trust wallet"
                      className="w-8 h-8"
                    />
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-[#00A79D]">
                    trust Wallet
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleConnectWallet(); }} className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedWalletType === "phantom" ? "bg-purple-100" : "bg-orange-100"
                }`}>
                <img
                  src={`/assets/${selectedWalletType}.png`}
                  alt={selectedWalletType}
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 capitalize">
                  {selectedWalletType} Wallet
                </h4>
                <p className="text-sm text-gray-500">Enter your wallet address</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Enter your Solana wallet address"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A79D] placeholder-gray-400 mb-4"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />

            <button
              disabled={loading}
              className="w-full py-4 bg-[#00A79D] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>

            <button
              type="button"
              onClick={() => setSelectedWalletType(null)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-3 transition"
            >
              Back to wallet selection
            </button>
          </form>
        )}
      </div>
    </div>
  );

  // No Connection State (Image 1)
  if (currentState === "no-connection") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <img src="/assets/emptywallet.png" alt="CredLend" className="w-40 h-40 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-[#14B9B5] mb-2">
              No wallet connected yet
            </h1>
            <p className="text-[#14B9B5]">
              Connect your wallet to get the most out of CredLend
            </p>
          </div>

          <button
            onClick={() => setShowWalletModal(true)}
            className="w-full bg-[#00A79D] text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Connect wallet
          </button>
        </div>

        {showWalletModal && <WalletModal />}
      </div>
    );
  }

  // Processing State (Image 2)
  if (currentState === "processing") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <img src="/assets/logo.png" alt="CredLend" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting Wallet</h2>
            <p className="text-gray-600">This won't take long..</p>
          </div>
        </div>
      </div>
    );
  }

  // Connected State (Image 3)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Single Column Layout */}
        <div className="space-y-6">
          {/* Balance Section */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
              <div className="flex flex-col w-full">
                <h1 className="text-lg font-bold text-[#00615F] mb-4 sm:mb-0">Your Wallet</h1>
                
                {/* Wallet Address & Balance Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  {internalWallet && (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <img src="/assets/logo.png" alt="USDC" className="w-6 h-6 sm:w-9 sm:h-9" />
                      <span className="text-xs sm:text-sm font-mono text-[#00615F]">
                        {internalWallet.address.slice(0, 6)}...{internalWallet.address.slice(-4)}
                      </span>
                      <button
                        onClick={() => handleCopyAddress(internalWallet.address)}
                        className="text-[#00615F] hover:text-[#14B9B5] transition"
                      >
                        <img src="/assets/copywallet.png" alt="Copy" className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                    <div className="text-sm text-[#00615F]">
                      <h2 className="text-xs text-gray-500">Total balance</h2>
                      <span className="font-semibold">
                        ${balanceData ? (
                          ((parseFloat(balanceData.sol_balance || 0) * 184.24) + parseFloat(balanceData.usdc_balance || 0)).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })
                        ) : '0.00'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-[#00615F]">
                      <h2 className="text-xs text-gray-500">Current collateral</h2>
                      <span className="font-semibold">$2,678</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-4">
              {/* Scale Bar */}
              <div className="w-full max-w-md mx-auto sm:mx-0">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="flex h-full">
                    {balanceData && (
                      <>
                        {/* SOL Portion */}
                        <div
                          className="bg-[#2775CA] transition-all duration-500"
                          style={{
                            width: `${((parseFloat(balanceData.sol_balance || 0) * 184.24) /
                              ((parseFloat(balanceData.sol_balance || 0) * 184.24) +
                                parseFloat(balanceData.usdc_balance || 0))) * 100}%`
                          }}
                        ></div>
                        {/* USDC Portion */}
                        <div
                          className="bg-[#55E5AC] transition-all duration-500"
                          style={{
                            width: `${(parseFloat(balanceData.usdc_balance || 0) /
                              ((parseFloat(balanceData.sol_balance || 0) * 184.24) +
                                parseFloat(balanceData.usdc_balance || 0))) * 100}%`
                          }}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Currency Distribution */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                {/* SOL */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <img src="/assets/sol.png" alt="SOL" className="w-6 h-6 sm:w-5 sm:h-5" />
                    <div className="text-sm text-[#00615F] font-medium">SOL</div>
                  </div>
                  <div className="text-sm font-semibold text-[#00615F]">
                    ${balanceData ? (parseFloat(balanceData.sol_balance || 0) * 184.24).toFixed(2) : '0.00'}
                  </div>
                </div>

                {/* USDC */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <img src="/assets/usdc.png" alt="USDC" className="w-6 h-6 sm:w-5 sm:h-5" />
                    <div className="text-sm text-[#00615F] font-medium">USDC</div>
                  </div>
                  <div className="text-sm font-semibold text-[#00615F]">
                    ${balanceData?.usdc_balance || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => router.push('/deposit')}
                className="flex-1 bg-[#00A79D] text-white items-center justify-center px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex gap-2"
              >
                <span>Deposit</span>
                <img src="/assets/arrup.png" alt="Deposit" className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/withdraw')}
                className="flex-1 bg-[#00A79D] text-white items-center justify-center px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex gap-2"
              >
                <span>Withdraw</span>
                <img src="/assets/arrdwn.png" alt="Withdraw" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Crypto Converter - Now in block layout */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#00615F] mb-6">Crypto converter</h3>
            <div className="space-y-4">
              {/* From Input */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    type="number"
                    value={converter.fromAmount}
                    onChange={(e) => handleConverterChange("fromAmount", e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-lg font-semibold text-[#00615F] outline-none w-full text-center sm:text-left"
                  />
                  <div className="flex items-center gap-3">
                    <img src="/assets/sol.png" alt="SOL" className="w-8 h-8" />
                    <span className="font-medium text-[#00615F]">SOL</span>
                  </div>
                </div>
              </div>

              {/* To Input */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    type="number"
                    value={converter.toAmount}
                    onChange={(e) => handleConverterChange("toAmount", e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-lg font-semibold text-[#00615F] outline-none w-full text-center sm:text-left"
                  />
                  <div className="flex items-center gap-3">
                    <img src="/assets/usdc.png" alt="USDC" className="w-8 h-8" />
                    <span className="font-medium text-[#00615F]">USDC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="text-center sm:text-left text-sm text-[#00615F] mt-4">
              1 SOL ≈ {converter.exchangeRate} USDC
            </div>

            {/* Fees */}
            <div className="flex justify-between text-sm mt-3 mb-6">
              <span className="text-[#00615F]">Total fees</span>
              <span className="text-[#00615F]">~ $1.2</span>
            </div>

            {/* Convert Button */}
            <button className="w-full bg-[#0F9996] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
              Convert
            </button>
          </div>

          {/* Transaction History - Now under the converter */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction history</h3>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
              {["All", "Sent", "Received"].map((tab) => (
                <button
                  key={tab}
                  className={`flex-shrink-0 pb-2 px-4 text-sm font-medium ${tab === "All"
                    ? "border-b-2 border-[#00A79D] text-[#00A79D]"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Transactions */}
            <div className="max-h-[500px] overflow-y-auto">
              <FullTransactionHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}