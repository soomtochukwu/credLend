"use client";

import { useState, useEffect } from "react";
import { FaCalculator, FaMoneyCheckAlt, FaCalendarAlt, FaDollarSign, FaPercentage, FaClock, FaChartLine } from "react-icons/fa";
import { FiRefreshCw, FiInfo } from "react-icons/fi";

export default function LoanCalculator() {
  const [calculatorForm, setCalculatorForm] = useState({
    amount: "",
    duration_days: "",
    interest_rate: "",
    loan_product: ""
  });
  
  const [loanProducts, setLoanProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [calculationResults, setCalculationResults] = useState(null);

  // Fetch loan products (similar to your existing function)
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
          setCalculatorForm(prev => ({ 
            ...prev, 
            loan_product: data[0].id,
            interest_rate: data[0].interest_rate 
          }));
          setSelectedProduct(data[0]);
        }
      } else {
        // Fallback to default products
        setLoanProducts(getDefaultLoanProducts());
        const defaultProducts = getDefaultLoanProducts();
        setSelectedProduct(defaultProducts[0]);
        setCalculatorForm(prev => ({
          ...prev,
          loan_product: defaultProducts[0].id,
          interest_rate: defaultProducts[0].interest_rate
        }));
      }
    } catch (error) {
      console.error("Error fetching loan products:", error);
      const defaultProducts = getDefaultLoanProducts();
      setLoanProducts(defaultProducts);
      setSelectedProduct(defaultProducts[0]);
      setCalculatorForm(prev => ({
        ...prev,
        loan_product: defaultProducts[0].id,
        interest_rate: defaultProducts[0].interest_rate
      }));
    }
  };

  const getDefaultLoanProducts = () => [
    {
      id: 1,
      name: "Category A: Secured",
      loan_type: "personal",
      description: "Personal loans for normal day to day life",
      min_amount: "5.00",
      max_amount: "2000.00",
      min_duration: 30,
      max_duration: 365,
      interest_rate: "6.00",
      collateral_required: false
    },
    {
      id: 4,
      name: "Category B: Short-term",
      loan_type: "personal",
      description: "A normal loan application for Credlend",
      min_amount: "5.00",
      max_amount: "1000.00",
      min_duration: 30,
      max_duration: 180,
      interest_rate: "8.00",
      collateral_required: false
    }
  ];

  // Update selected product and interest rate when product changes
  useEffect(() => {
    if (calculatorForm.loan_product) {
      const product = loanProducts.find(p => p.id == calculatorForm.loan_product);
      setSelectedProduct(product);
      if (product) {
        setCalculatorForm(prev => ({
          ...prev,
          interest_rate: product.interest_rate
        }));
      }
    }
  }, [calculatorForm.loan_product, loanProducts]);

  // Calculate loan details
  const calculateLoan = () => {
    const amount = parseFloat(calculatorForm.amount) || 0;
    const duration = parseInt(calculatorForm.duration_days) || 0;
    const interestRate = parseFloat(calculatorForm.interest_rate) || 0;
    
    if (amount <= 0 || duration <= 0 || interestRate <= 0) {
      setCalculationResults(null);
      return;
    }

    // Calculate interest (simple interest for the duration)
    const interest = (amount * interestRate / 100) * (duration / 365);
    const totalRepayment = amount + interest;
    const dailyPayment = totalRepayment / duration;
    const weeklyPayment = totalRepayment / (duration / 7);
    const monthlyPayment = totalRepayment / (duration / 30);

    // Calculate different scenarios
    const scenarios = [
      { duration: 30, label: '1 Month' },
      { duration: 60, label: '2 Months' },
      { duration: 90, label: '3 Months' },
      { duration: 180, label: '6 Months' },
      { duration: 365, label: '1 Year' }
    ].map(scenario => {
      const scenarioInterest = (amount * interestRate / 100) * (scenario.duration / 365);
      return {
        ...scenario,
        totalRepayment: (amount + scenarioInterest).toFixed(2),
        interest: scenarioInterest.toFixed(2)
      };
    });

    setCalculationResults({
      principal: amount.toFixed(2),
      interest: interest.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      dailyPayment: dailyPayment.toFixed(2),
      weeklyPayment: weeklyPayment.toFixed(2),
      monthlyPayment: monthlyPayment.toFixed(2),
      interestRate: interestRate,
      duration: duration,
      scenarios: scenarios
    });
  };

  // Auto-calculate when form changes
  useEffect(() => {
    calculateLoan();
  }, [calculatorForm.amount, calculatorForm.duration_days, calculatorForm.interest_rate]);

  const handleInputChange = (field, value) => {
    setCalculatorForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetCalculator = () => {
    setCalculatorForm({
      amount: "",
      duration_days: "",
      interest_rate: selectedProduct?.interest_rate || "6.00",
      loan_product: selectedProduct?.id || ""
    });
    setCalculationResults(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <FaCalculator className="text-2xl text-[var(--cred-teal)]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Loan Calculator</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simulate different loan scenarios to find the perfect plan for your needs. 
            Adjust the parameters and see real-time calculations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FaMoneyCheckAlt className="text-[var(--cred-teal)]" />
                Loan Parameters
              </h2>
              <button
                onClick={resetCalculator}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FiRefreshCw size={14} />
                Reset
              </button>
            </div>

            <div className="space-y-6">
              {/* Loan Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Product Type
                </label>
                <select
                  value={calculatorForm.loan_product}
                  onChange={(e) => handleInputChange('loan_product', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent outline-none transition-all"
                >
                  {loanProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.interest_rate}% interest)
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                    <strong>{selectedProduct.name}:</strong> {selectedProduct.description}
                  </div>
                )}
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount ($)
                </label>
                <div className="relative">
                  <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={calculatorForm.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="Enter loan amount"
                    min={selectedProduct?.min_amount || 0}
                    max={selectedProduct?.max_amount || 10000}
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent outline-none transition-all"
                  />
                </div>
                {selectedProduct && (
                  <div className="mt-1 text-xs text-gray-500">
                    Range: ${selectedProduct.min_amount} - ${selectedProduct.max_amount}
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Duration (days)
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={calculatorForm.duration_days}
                    onChange={(e) => handleInputChange('duration_days', e.target.value)}
                    placeholder="Enter duration in days"
                    min={selectedProduct?.min_duration || 1}
                    max={selectedProduct?.max_duration || 365}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent outline-none transition-all"
                  />
                </div>
                {selectedProduct && (
                  <div className="mt-1 text-xs text-gray-500">
                    Range: {selectedProduct.min_duration} - {selectedProduct.max_duration} days
                  </div>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Interest Rate (%)
                </label>
                <div className="relative">
                  <FaPercentage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={calculatorForm.interest_rate}
                    onChange={(e) => handleInputChange('interest_rate', e.target.value)}
                    placeholder="Enter interest rate"
                    min="0.1"
                    max="50"
                    step="0.1"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Amounts
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleInputChange('amount', amount)}
                      className="p-2 text-xs bg-gray-100 hover:bg-[var(--cred-teal)] hover:text-white rounded-lg transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Duration Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Durations
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 30, label: '1M' },
                    { days: 60, label: '2M' },
                    { days: 90, label: '3M' },
                    { days: 180, label: '6M' }
                  ].map((duration) => (
                    <button
                      key={duration.days}
                      onClick={() => handleInputChange('duration_days', duration.days)}
                      className="p-2 text-xs bg-gray-100 hover:bg-[var(--cred-teal)] hover:text-white rounded-lg transition-colors"
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Main Results Card */}
            {calculationResults ? (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <FaChartLine className="text-[var(--cred-teal)]" />
                  Calculation Results
                </h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">Total Repayment</div>
                    <div className="text-2xl font-bold text-blue-800">
                      {formatCurrency(parseFloat(calculationResults.totalRepayment))}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 mb-1">Total Interest</div>
                    <div className="text-2xl font-bold text-green-800">
                      {formatCurrency(parseFloat(calculationResults.interest))}
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FaClock className="text-[var(--cred-teal)]" />
                    Payment Schedule
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Daily</div>
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(parseFloat(calculationResults.dailyPayment))}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Weekly</div>
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(parseFloat(calculationResults.weeklyPayment))}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Monthly</div>
                      <div className="font-semibold text-gray-800">
                        {formatCurrency(parseFloat(calculationResults.monthlyPayment))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal Amount:</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(calculationResults.principal))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest ({calculationResults.interestRate}%):</span>
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(parseFloat(calculationResults.interest))}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="text-gray-800 font-semibold">Total Repayment:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(parseFloat(calculationResults.totalRepayment))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
                <FaCalculator className="text-4xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Enter Loan Details
                </h3>
                <p className="text-gray-500 text-sm">
                  Fill in the loan amount, duration, and interest rate to see detailed calculations.
                </p>
              </div>
            )}

            {/* Comparison Scenarios */}
            {calculationResults && calculationResults.scenarios && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FiInfo className="text-[var(--cred-teal)]" />
                  Compare Different Durations
                </h3>
                <div className="space-y-3">
                  {calculationResults.scenarios.map((scenario, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                      <div>
                        <div className="font-medium text-gray-800">{scenario.label}</div>
                        <div className="text-xs text-gray-500">{scenario.duration} days</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">
                          {formatCurrency(parseFloat(scenario.totalRepayment))}
                        </div>
                        <div className="text-xs text-orange-600">
                          Interest: {formatCurrency(parseFloat(scenario.interest))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Note:</strong> This calculator provides estimates based on simple interest calculations. 
                  Final loan terms may vary based on credit assessment and specific product features. 
                  The interest is calculated pro-rata for the exact duration specified.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ready to Apply?
            </h3>
            <p className="text-gray-600 mb-4">
              Found your perfect loan plan? Start your application process now.
            </p>
            <button
              onClick={() => window.location.href = '/loan'}
              className="bg-[var(--cred-teal)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Apply for Loan Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}