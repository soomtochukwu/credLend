"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LendPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pools");
  const [pools, setPools] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [activeDeposits, setActiveDeposits] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getAccessToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // Fetch all data
  useEffect(() => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      toast.error("Please log in to continue");
      router.push("/login");
      return;
    }

    fetchPools(accessToken);
    fetchDeposits(accessToken);
    fetchActiveDeposits(accessToken);
    fetchAllocations(accessToken);
  }, [router]);

  const fetchPools = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/lending/pools/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Handle different response formats
        if (Array.isArray(data)) {
          setPools(data);
        } else if (data.results && Array.isArray(data.results)) {
          setPools(data.results);
        } else {
          setPools([]);
        }
      } else {
        console.error("Failed to fetch pools");
        setPools([]);
      }
    } catch (error) {
      console.error("Error fetching pools:", error);
      setPools([]);
    }
  };

  const fetchDeposits = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/lending/deposits/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDeposits(data);
        } else if (data.results && Array.isArray(data.results)) {
          setDeposits(data.results);
        } else {
          setDeposits([]);
        }
      } else {
        console.error("Failed to fetch deposits");
        setDeposits([]);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
      setDeposits([]);
    }
  };

  const fetchActiveDeposits = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/lending/deposits/active/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActiveDeposits(data);
        } else if (data.results && Array.isArray(data.results)) {
          setActiveDeposits(data.results);
        } else {
          setActiveDeposits([]);
        }
      } else {
        console.error("Failed to fetch active deposits");
        setActiveDeposits([]);
      }
    } catch (error) {
      console.error("Error fetching active deposits:", error);
      setActiveDeposits([]);
    }
  };

  const fetchAllocations = async (token) => {
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/lending/allocations/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllocations(data);
        } else if (data.results && Array.isArray(data.results)) {
          setAllocations(data.results);
        } else {
          setAllocations([]);
        }
      } else {
        console.error("Failed to fetch allocations");
        setAllocations([]);
      }
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setAllocations([]);
    }
  };

  const handleDeposit = async (poolId) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Please log in to continue");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (selectedPool && amount < parseFloat(selectedPool.min_deposit)) {
      toast.error(`Minimum deposit is ${formatCurrency(selectedPool.min_deposit)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/lending/deposits/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pool: poolId,
            amount: amount.toString(),
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Deposit successful! Your funds will be automatically allocated to approved loans.");
        setDepositAmount("");
        setSelectedPool(null);
        // Refresh data
        await Promise.all([
          fetchPools(token),
          fetchDeposits(token),
          fetchActiveDeposits(token),
          fetchAllocations(token)
        ]);
      } else {
        const errorMessage = data.error || data.detail || 
                            (data.amount && data.amount[0]) || 
                            "Deposit failed";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to process deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (depositId) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Please log in to continue");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://credlend.pythonanywhere.com/api/lending/deposits/${depositId}/withdraw/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Withdrawal successful!");
        // Refresh data
        await Promise.all([
          fetchDeposits(token),
          fetchActiveDeposits(token),
          fetchPools(token),
          fetchAllocations(token)
        ]);
      } else {
        toast.error(data.error || data.detail || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPoolColor = (poolType) => {
    return poolType === 'stablecoin' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate estimated earnings
  const calculateEarnings = (amount, apy, days) => {
    const principal = typeof amount === 'string' ? parseFloat(amount) : amount;
    const annualRate = typeof apy === 'string' ? parseFloat(apy) : apy;
    
    if (isNaN(principal) || isNaN(annualRate) || isNaN(days)) return 0;
    
    const dailyRate = annualRate / 100 / 365;
    return principal * dailyRate * days;
  };

  // Safe array getters
  const safePools = Array.isArray(pools) ? pools : [];
  const safeDeposits = Array.isArray(deposits) ? deposits : [];
  const safeActiveDeposits = Array.isArray(activeDeposits) ? activeDeposits : [];
  const safeAllocations = Array.isArray(allocations) ? allocations : [];

  const MobileTabButton = ({ tab, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 py-3 px-2 text-center font-medium transition-colors whitespace-nowrap text-sm ${
        isActive
          ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50"
          : "text-gray-500 hover:text-gray-700 bg-white"
      }`}
    >
      <div className="flex flex-col items-center space-y-1">
        <span>{tab.name}</span>
        {tab.count > 0 && (
          <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full min-w-[20px]">
            {tab.count}
          </span>
        )}
      </div>
    </button>
  );

  const tabs = [
    { id: "pools", name: "Pools", count: safePools.length },
    { id: "deposits", name: "My Deposits", count: safeDeposits.length },
    { id: "active", name: "Active", count: safeActiveDeposits.length },
    { id: "allocations", name: "Loans", count: safeAllocations.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Lending Platform</h1>
          <p className="text-gray-600 text-sm sm:text-lg px-2">
            Deposit into pools and earn interest. Funds are automatically allocated to approved borrowers.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Deposited</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(safeDeposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Active Deposits</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{safeActiveDeposits.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Active Loans</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{safeAllocations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="sm:hidden bg-white rounded-xl shadow-lg mb-4 overflow-x-auto">
          <div className="flex" style={{ minWidth: 'min-content' }}>
            {tabs.map((tab) => (
              <MobileTabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:block bg-white rounded-2xl shadow-lg mb-6 sm:mb-8">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 py-4 px-6 text-center font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Lending Pools Tab */}
            {activeTab === "pools" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Available Lending Pools</h2>
                  <div className="text-sm text-gray-600">
                    {safePools.length} pool{safePools.length !== 1 ? 's' : ''} available
                  </div>
                </div>
                
                {safePools.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 text-base sm:text-lg mb-2">No lending pools available</div>
                    <div className="text-gray-500 text-sm">Check back later for new investment opportunities</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {safePools.map((pool) => (
                      <div key={pool.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${getPoolColor(pool.pool_type)} flex items-center justify-center text-white font-bold text-sm sm:text-base`}>
                            {pool.pool_type === 'stablecoin' ? 'USDC' : 'SOL'}
                          </div>
                          <div className="text-right">
                            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-full">
                              {pool.pool_type_display || pool.pool_type}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {pool.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>

                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{pool.name}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{pool.description}</p>

                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">APY</span>
                            <span className="text-xl sm:text-2xl font-bold text-green-600">{pool.apy}%</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Total Liquidity</span>
                            <span className="font-semibold text-sm">{formatCurrency(pool.total_liquidity)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Available</span>
                            <span className="font-semibold text-sm">{formatCurrency(pool.available_liquidity)}</span>
                          </div>

                          {pool.utilization_rate !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Utilization</span>
                              <span className="font-semibold text-sm">{pool.utilization_rate?.toFixed(1)}%</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Min Deposit</span>
                            <span className="font-semibold text-sm">{formatCurrency(pool.min_deposit)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Lock Period</span>
                            <span className="font-semibold text-sm">{pool.lock_period_days} days</span>
                          </div>
                        </div>

                        {/* Estimated Earnings */}
                        {pool.lock_period_days > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                            <div className="text-xs sm:text-sm text-blue-800 text-center">
                              Est. earnings: {formatCurrency(calculateEarnings(pool.min_deposit, pool.apy, pool.lock_period_days))} {pool.pool_type === 'stablecoin' ? 'USDC' : 'SOL'}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedPool(pool)}
                          disabled={!pool.is_active}
                          className="w-full py-2 sm:py-3 rounded-lg text-white font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                          style={{
                            background: "linear-gradient(180deg, #14B9B5 0%, #0ea79b 100%)",
                          }}
                        >
                          {pool.is_active ? "Deposit Now" : "Coming Soon"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Deposits Tab */}
            {activeTab === "deposits" && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">My Deposit History</h2>
                
                {safeDeposits.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 text-base sm:text-lg mb-2">No deposits yet</div>
                    <div className="text-gray-500 text-sm mb-4">Start earning by depositing into a lending pool</div>
                    <button
                      onClick={() => setActiveTab("pools")}
                      className="py-2 px-6 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
                    >
                      Browse Pools
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Mobile Cards View */}
                    <div className="sm:hidden space-y-3 p-3">
                      {safeDeposits.map((deposit) => (
                        <div key={deposit.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {deposit.pool_details?.name || 'Unknown Pool'}
                              </h3>
                              <p className="text-gray-500 text-xs">
                                {deposit.pool_details?.pool_type || 'N/A'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deposit.status)}`}>
                              {deposit.status || (deposit.withdrawn ? 'Withdrawn' : 'Active')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-gray-600 text-xs">Amount:</span>
                              <p className="font-semibold">{formatCurrency(deposit.amount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 text-xs">Shares:</span>
                              <p className="font-semibold">{deposit.shares ? formatCurrency(deposit.shares) : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 text-xs">Unlock Date:</span>
                              <p className="font-semibold text-xs">{deposit.unlocked_at ? formatDate(deposit.unlocked_at) : 'N/A'}</p>
                            </div>
                          </div>

                          {!deposit.withdrawn && deposit.unlocked_at && new Date(deposit.unlocked_at) <= new Date() && (
                            <button
                              onClick={() => handleWithdraw(deposit.id)}
                              disabled={loading}
                              className="w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unlock Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {safeDeposits.map((deposit) => (
                            <tr key={deposit.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {deposit.pool_details?.name || 'Unknown Pool'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {deposit.pool_details?.pool_type || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(deposit.amount)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {deposit.shares ? formatCurrency(deposit.shares) : 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deposit.status)}`}>
                                  {deposit.status || (deposit.withdrawn ? 'Withdrawn' : 'Active')}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {deposit.unlocked_at ? formatDate(deposit.unlocked_at) : 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                {!deposit.withdrawn && deposit.unlocked_at && new Date(deposit.unlocked_at) <= new Date() && (
                                  <button
                                    onClick={() => handleWithdraw(deposit.id)}
                                    disabled={loading}
                                    className="text-teal-600 hover:text-teal-900 disabled:opacity-50 px-3 py-1 border border-teal-600 rounded hover:bg-teal-50 transition-colors"
                                  >
                                    Withdraw
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Deposits Tab */}
            {activeTab === "active" && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Active Deposits</h2>
                
                {safeActiveDeposits.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 text-base sm:text-lg mb-2">No active deposits</div>
                    <div className="text-gray-500 text-sm mb-4">Your active deposits will appear here</div>
                    <button
                      onClick={() => setActiveTab("pools")}
                      className="py-2 px-6 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
                    >
                      Start Lending
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {safeActiveDeposits.map((deposit) => (
                      <div key={deposit.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {deposit.pool_details?.name || 'Unknown Pool'}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deposit.status)}`}>
                            {deposit.status || 'Active'}
                          </span>
                        </div>

                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Amount</span>
                            <span className="font-semibold text-sm">{formatCurrency(deposit.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Shares</span>
                            <span className="font-semibold text-sm">{deposit.shares ? formatCurrency(deposit.shares) : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">APY</span>
                            <span className="font-semibold text-green-600 text-sm">{deposit.pool_details?.apy || 'N/A'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Unlocks On</span>
                            <span className="font-semibold text-sm">{deposit.unlocked_at ? formatDate(deposit.unlocked_at) : 'N/A'}</span>
                          </div>
                        </div>

                        {deposit.unlocked_at && new Date(deposit.unlocked_at) <= new Date() && (
                          <button
                            onClick={() => handleWithdraw(deposit.id)}
                            disabled={loading}
                            className="w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            Withdraw Funds
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Allocations Tab */}
            {activeTab === "allocations" && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Funded Loans</h2>
                <p className="text-gray-600 text-sm mb-4 sm:mb-6">
                  These are the loans that your deposited funds have been allocated to. 
                  The system automatically distributes pool funds to approved borrowers.
                </p>
                
                {safeAllocations.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 text-base sm:text-lg mb-2">No active loan allocations</div>
                    <div className="text-gray-500 text-sm mb-4">Your funds will appear here when allocated to approved loans</div>
                    <button
                      onClick={() => setActiveTab("pools")}
                      className="py-2 px-6 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
                    >
                      Deposit Funds
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {safeAllocations.map((allocation) => (
                      <div key={allocation.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Loan #{allocation.loan_details?.id || allocation.id}
                          </h3>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto">
                            Active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-3 sm:mb-4">
                          <div>
                            <label className="text-xs sm:text-sm text-gray-600 block mb-1">From Pool</label>
                            <p className="font-semibold text-gray-900 text-sm">{allocation.pool_details?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs sm:text-sm text-gray-600 block mb-1">Amount Funded</label>
                            <p className="font-semibold text-gray-900 text-sm">{formatCurrency(allocation.amount)}</p>
                          </div>
                          <div>
                            <label className="text-xs sm:text-sm text-gray-600 block mb-1">Loan Interest</label>
                            <p className="font-semibold text-green-600 text-sm">{allocation.loan_details?.interest_rate || 'N/A'}%</p>
                          </div>
                          <div>
                            <label className="text-xs sm:text-sm text-gray-600 block mb-1">Allocation Date</label>
                            <p className="font-semibold text-gray-900 text-sm">{formatDate(allocation.created_at)}</p>
                          </div>
                        </div>

                        {/* Borrower Information if available */}
                        {allocation.borrower_details && (
                          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Borrower Information</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-600 block">Credit Score:</span>
                                <span className="font-medium">{allocation.borrower_details.credit_score || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 block">KYC Status:</span>
                                <span className={`font-medium ${allocation.borrower_details.kyc_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {allocation.borrower_details.kyc_verified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 block">Email:</span>
                                <span className="font-medium truncate text-xs">{allocation.borrower_details.email || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 block">Wallet:</span>
                                <span className="font-mono text-xs">
                                  {allocation.borrower_details.external_wallet ? 
                                    `${allocation.borrower_details.external_wallet.slice(0, 8)}...` : 
                                    'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transaction Hash */}
                        {allocation.allocation_tx_hash && (
                          <div className="mt-3 text-xs sm:text-sm">
                            <span className="text-gray-600">Transaction: </span>
                            <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                              {allocation.allocation_tx_hash.slice(0, 20)}...
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Deposit to {selectedPool.name}
              </h3>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Deposit
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Minimum: ${formatCurrency(selectedPool.min_deposit)}`}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm sm:text-base focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  min={selectedPool.min_deposit}
                  step="0.000001"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Minimum deposit: {formatCurrency(selectedPool.min_deposit)}
                </p>
              </div>

              {/* Pool Details */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Pool Details</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">APY:</span>
                    <span className="font-semibold text-green-600">{selectedPool.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lock Period:</span>
                    <span className="font-semibold">{selectedPool.lock_period_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Type:</span>
                    <span className="font-semibold">{selectedPool.pool_type_display || selectedPool.pool_type}</span>
                  </div>
                </div>
              </div>

              {/* Estimated Earnings */}
              {depositAmount && parseFloat(depositAmount) >= parseFloat(selectedPool.min_deposit) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Estimated Earnings</h4>
                  <p className="text-xs sm:text-sm text-blue-600">
                    You could earn approximately {formatCurrency(calculateEarnings(parseFloat(depositAmount), selectedPool.apy, selectedPool.lock_period_days))} {selectedPool.pool_type === 'stablecoin' ? 'USDC' : 'SOL'} over {selectedPool.lock_period_days} days
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>Note:</strong> Funds will be automatically allocated to approved borrowers and locked for {selectedPool.lock_period_days} days. 
                  Early withdrawal is not permitted.
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedPool(null)}
                  className="flex-1 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeposit(selectedPool.id)}
                  disabled={loading || !depositAmount || parseFloat(depositAmount) < parseFloat(selectedPool.min_deposit)}
                  className="flex-1 py-2 sm:py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{
                    background: "linear-gradient(180deg, #14B9B5 0%, #0ea79b 100%)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center text-xs sm:text-sm">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Confirm Deposit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}