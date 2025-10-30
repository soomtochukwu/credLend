"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function RepaymentsPage() {
  const BASE_URL = "https://credlend.pythonanywhere.com/api/loans/repayments/";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error("You must be logged in to view repayments");
      return;
    }

    const fetchRepayments = async () => {
      try {
        const res = await fetch(BASE_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        // Handle both array and non-array responses safely
        if (Array.isArray(data)) {
          setRepayments(data);
        } else if (Array.isArray(data.results)) {
          setRepayments(data.results);
        } else {
          setRepayments([]);
        }
      } catch (err) {
        toast.error("Failed to load repayments");
      } finally {
        setLoading(false);
      }
    };

    fetchRepayments();
  }, [token]);

  const handlePay = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}${id}/pay/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Repayment paid successfully!");
        setRepayments((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error("Failed to process payment");
      }
    } catch {
      toast.error("Network error while processing payment");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Your Repayments
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading repayments...</p>
      ) : repayments.length === 0 ? (
        <p className="text-gray-600">No repayments due</p>
      ) : (
        <div className="space-y-4">
          {repayments.map((r) => (
            <div
              key={r.id}
              className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white flex justify-between items-center"
            >
              <div>
                <p className="font-medium">Amount: ₦{r.amount}</p>
                <p className="text-sm text-gray-600">
                  Due: {new Date(r.due_date).toLocaleDateString()}
                </p>
                <p
                  className={`text-sm ${
                    r.status === "PAID" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Status: {r.status}
                </p>
              </div>

              {!r.paid_at && (
                <button
                  onClick={() => handlePay(r.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Pay
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
