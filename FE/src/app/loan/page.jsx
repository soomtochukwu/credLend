"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FaMoneyCheckAlt, FaInfoCircle, FaCalculator, FaShieldAlt } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";

export default function LoanApplicationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    loan_product: "",
    amount: "",
    duration_days: "",
    purpose: "",
    collateral_type: "",
    collateral_value: ""
  });
  const [loading, setLoading] = useState(false);
  const [loanProducts, setLoanProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch loan products on component mount
  useEffect(() => {
    fetchLoanProducts();
  }, []);

  const fetchLoanProducts = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/loans/products/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setLoanProducts(data);
        
        // Set default to first product if available
        if (data.length > 0) {
          setForm(prev => ({ ...prev, loan_product: data[0].id }));
          setSelectedProduct(data[0]);
        }
      } else {
        console.error("Failed to fetch loan products");
        // Fallback to default products based on your images
        setLoanProducts(getDefaultLoanProducts());
        setSelectedProduct(getDefaultLoanProducts()[0]);
      }
    } catch (error) {
      console.error("Error fetching loan products:", error);
      // Fallback to default products
      setLoanProducts(getDefaultLoanProducts());
      setSelectedProduct(getDefaultLoanProducts()[0]);
    }
  };

  // Default loan products based on your images
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
      name: "category B: short-term",
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

  // Update selected product when loan product changes
  useEffect(() => {
    if (form.loan_product) {
      const product = loanProducts.find(p => p.id == form.loan_product);
      setSelectedProduct(product);
      
      // Reset collateral fields when product changes
      if (product && !product.collateral_required) {
        setForm(prev => ({
          ...prev,
          collateral_type: "",
          collateral_value: ""
        }));
      }
    }
  }, [form.loan_product, loanProducts]);

  // Calculate loan details
  const calculateLoanDetails = () => {
    const amount = parseFloat(form.amount) || 0;
    const duration = parseInt(form.duration_days) || 0;
    
    if (amount <= 0 || duration <= 0 || !selectedProduct) return null;

    const interestRate = parseFloat(selectedProduct.interest_rate);
    const interest = (amount * interestRate / 100) * (duration / 365);
    const totalRepayment = amount + interest;
    const dailyPayment = totalRepayment / duration;

    return {
      interest: interest.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      dailyPayment: dailyPayment.toFixed(2),
      interestRate: interestRate
    };
  };

  const loanDetails = calculateLoanDetails();

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in first");
      router.push("/login");
      return;
    }

    // Validation
    const amount = parseFloat(form.amount);
    const duration = parseInt(form.duration_days);

    if (!form.loan_product || !form.amount || !form.duration_days || !form.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedProduct) {
      toast.error("Please select a valid loan product");
      return;
    }

    if (amount < parseFloat(selectedProduct.min_amount) || amount > parseFloat(selectedProduct.max_amount)) {
      toast.error(`Amount must be between $${selectedProduct.min_amount} and $${selectedProduct.max_amount}`);
      return;
    }

    if (duration < selectedProduct.min_duration || duration > selectedProduct.max_duration) {
      toast.error(`Duration must be between ${selectedProduct.min_duration} and ${selectedProduct.max_duration} days`);
      return;
    }

    // Collateral validation for products 2 and 3
    if (selectedProduct.collateral_required) {
      if (!form.collateral_type) {
        toast.error("Please select collateral type");
        return;
      }
      if (!form.collateral_value || parseFloat(form.collateral_value) <= 0) {
        toast.error("Please enter collateral value");
        return;
      }
      
      // LTV ratio validation for product 2
      if (selectedProduct.id === 2 && selectedProduct.ltv_ratio) {
        const ltvRatio = parseFloat(selectedProduct.ltv_ratio);
        const minCollateralValue = amount / (ltvRatio / 100);
        if (parseFloat(form.collateral_value) < minCollateralValue) {
          toast.error(`Collateral value must be at least $${minCollateralValue.toFixed(2)} for ${ltvRatio}% LTV ratio`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const submitData = {
        loan_product: form.loan_product,
        amount: form.amount,
        duration_days: form.duration_days,
        purpose: form.purpose
      };

      // Add collateral data if required
      if (selectedProduct.collateral_required) {
        submitData.collateral_type = form.collateral_type;
        submitData.collateral_value = form.collateral_value;
      }

      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/loans/applications/",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Loan application submitted successfully!");
        setTimeout(() => router.push("/loan/dashboard"), 1200);
      } else {
        console.error("Loan application failed:", data);
        toast.error(
          data?.error ||
            data?.message ||
            "Failed to submit application. Try again."
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Collateral types
  const collateralTypes = [
    { value: "real_estate", label: "Real Estate" },
    { value: "crypto", label: "Cryptocurrency" },
    { value: "vehicle", label: "Vehicle" },
    { value: "other", label: "Other" }
  ];

  // ✨ Loading animation
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-[var(--cred-teal)] text-white space-y-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-white p-3 rounded-full shadow-md">
            <img
              src="/assets/logo.png"
              alt="Credlend Logo"
              className="w-10 h-10"
            />
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
        <h2 className="text-xl font-semibold">
          Submitting your loan application...
        </h2>
        <p className="text-sm opacity-90">
          Please wait while we securely process your request.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cred-teal)] to-[#0ea79b]/70 flex items-center justify-center py-12 px-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-4xl border border-white/50">
        <div className="text-center mb-6">
          <img
            src="/assets/logo.png"
            alt="Credlend Logo"
            className="w-16 h-16 mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            Apply for a Loan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Choose a loan product and fill in your details
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Loan Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Loan Product
              </label>
              <select
                value={form.loan_product}
                onChange={(e) => setForm({ ...form, loan_product: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] outline-none"
                required
              >
                <option value="">Select a loan product</option>
                {loanProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.loan_type}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">{selectedProduct.name}</p>
                    <p className="mb-2">{selectedProduct.description}</p>
                    <ul className="space-y-1">
                      <li>• Amount: <strong>${selectedProduct.min_amount} - ${selectedProduct.max_amount}</strong></li>
                      <li>• Duration: <strong>{selectedProduct.min_duration} - {selectedProduct.max_duration} days</strong></li>
                      <li>• Interest rate: <strong>{selectedProduct.interest_rate}%</strong></li>
                      {selectedProduct.collateral_required && (
                        <li className="flex items-center gap-1">
                          <FaShieldAlt className="text-orange-600" size={12} />
                          <span className="text-orange-700 font-semibold">Collateral Required</span>
                          {selectedProduct.ltv_ratio && (
                            <span> (LTV: {selectedProduct.ltv_ratio}%)</span>
                          )}
                          {selectedProduct.min_credit_score && (
                            <span> | Min Credit: {selectedProduct.min_credit_score}</span>
                          )}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Loan Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder={selectedProduct ? `Between $${selectedProduct.min_amount} - $${selectedProduct.max_amount}` : "Enter amount"}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min={selectedProduct?.min_amount || 0}
                  max={selectedProduct?.max_amount || 10000}
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] outline-none"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedProduct ? `$${selectedProduct.min_amount} - $${selectedProduct.max_amount}` : "Select a loan product first"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  name="duration_days"
                  placeholder={selectedProduct ? `Between ${selectedProduct.min_duration} - ${selectedProduct.max_duration} days` : "Enter duration"}
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  min={selectedProduct?.min_duration || 0}
                  max={selectedProduct?.max_duration || 365}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] outline-none"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedProduct ? `${selectedProduct.min_duration} - ${selectedProduct.max_duration} days` : "Select a loan product first"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Purpose
                </label>
                <textarea
                  name="purpose"
                  placeholder="What is the purpose of the loan?"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] outline-none resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Collateral Section - Only show for products 2 and 3 */}
              {selectedProduct?.collateral_required && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <FaShield className="text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-800">Collateral Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Collateral Type
                    </label>
                    <select
                      value={form.collateral_type}
                      onChange={(e) => setForm({ ...form, collateral_type: e.target.value })}
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                      required
                    >
                      <option value="">Select collateral type</option>
                      {collateralTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Collateral Value ($)
                    </label>
                    <input
                      type="number"
                      name="collateral_value"
                      placeholder="Enter estimated collateral value"
                      value={form.collateral_value}
                      onChange={(e) => setForm({ ...form, collateral_value: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      required
                    />
                    {selectedProduct.ltv_ratio && (
                      <div className="text-xs text-orange-600 mt-1">
                        Minimum collateral: ${(parseFloat(form.amount || 0) / (parseFloat(selectedProduct.ltv_ratio) / 100)).toFixed(2)} 
                        (LTV: {selectedProduct.ltv_ratio}%)
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[var(--cred-teal)] text-white py-3 rounded-lg font-semibold transition ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
                }`}
              >
                Apply Now
              </button>
            </form>
          </div>

          {/* Calculator Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaCalculator className="text-[var(--cred-teal)]" />
              <h3 className="text-lg font-semibold text-gray-800">Loan Calculator</h3>
            </div>
            
            {loanDetails && selectedProduct ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Loan Amount</div>
                    <div className="font-semibold text-gray-800">${parseFloat(form.amount).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="font-semibold text-gray-800">{form.duration_days} days</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-600">Interest ({loanDetails.interestRate}% p.a.):</span>
                    <span className="font-semibold text-orange-600">${loanDetails.interest}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-600">Total Repayment:</span>
                    <span className="font-semibold text-green-600">${loanDetails.totalRepayment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Daily Payment:</span>
                    <span className="font-semibold text-blue-600">${loanDetails.dailyPayment}</span>
                  </div>
                </div>

                {selectedProduct.collateral_required && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                    <div className="text-xs text-orange-800">
                      <strong>Collateral Required:</strong> This loan requires collateral. 
                      {selectedProduct.ltv_ratio && ` Maximum LTV ratio: ${selectedProduct.ltv_ratio}%`}
                      {selectedProduct.min_credit_score && ` Minimum credit score: ${selectedProduct.min_credit_score}`}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-xs text-yellow-800">
                    <strong>Note:</strong> This is an estimate. Final terms may vary based on credit assessment.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCalculator className="text-gray-300 text-3xl mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Select a loan product and enter details to see repayment information
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/loan/dashboard')}
            className="text-[var(--cred-teal)] hover:underline text-sm"
          >
            ← Back to Loan Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}