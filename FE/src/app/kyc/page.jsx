"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiHome,
  FiUpload,
  FiFileText,
  FiUserCheck,
  FiEye,
  FiEyeOff,
  FiArrowLeft
} from "react-icons/fi";

export default function KycPage() {
  const router = useRouter();
  const [files, setFiles] = useState({
    passport: null,
    id_front: null,
    id_back: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    passport: null,
    id_front: null,
    id_back: null,
  });
  const [form, setForm] = useState({
    document_type: "passport",
    document_number: "",
  });
  const [kycData, setKycData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hasKyc, setHasKyc] = useState(false);
  const [showDocumentNumber, setShowDocumentNumber] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const BASE_URL = "https://credlend.pythonanywhere.com/api/kyc";
  const USER_URL = "https://credlend.pythonanywhere.com/api/users/profile/";

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // 🔹 Fetch User Profile and KYC Status
  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("Please log in first");
      router.push("/login?next=/kyc");
      return;
    }

    fetchUserProfile(token);
    fetchKycStatus(token);
  }, [router]);

  const fetchUserProfile = async (token) => {
    try {
      const res = await fetch(USER_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const userData = await res.json();
        setUserData(userData);
      }
    } catch (error) {
      console.error("[KYC] Error fetching user profile:", error);
    }
  };

  const fetchKycStatus = async (token) => {
    try {
      setLoading(true);

      // Try to fetch KYC documents
      try {
        const docsRes = await fetch(`${BASE_URL}/documents/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          console.log("[KYC] Documents response:", docsData);

          // Handle different response formats
          let documents = [];
          if (Array.isArray(docsData)) {
            documents = docsData;
          } else if (docsData.results && Array.isArray(docsData.results)) {
            documents = docsData.results;
          } else if (docsData.id) {
            documents = [docsData];
          }

          if (documents.length > 0) {
            const latestDoc = documents[0];
            setKycData(latestDoc);
            setHasKyc(true);
          } else {
            setHasKyc(false);
          }
        }
      } catch (docsError) {
        console.warn("[KYC] Could not fetch documents:", docsError);
      }

    } catch (error) {
      console.error("[KYC] Error fetching KYC status:", error);
      toast.error("Could not load KYC information");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE KYC Function
  const handleDeleteKyc = async () => {
    const token = getToken();
    if (!token || !kycData?.id) {
      toast.error("Cannot delete KYC data");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/documents/${kycData.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("KYC data deleted successfully!");
        setKycData(null);
        setHasKyc(false);
        setShowDeleteConfirm(false);

        // Clear any form data
        setForm({ document_type: "passport", document_number: "" });
        setFiles({ passport: null, id_front: null, id_back: null });
        setFilePreviews({ passport: null, id_front: null, id_back: null });
      } else {
        throw new Error("Failed to delete KYC data");
      }
    } catch (err) {
      console.error("[KYC] Delete error:", err);
      toast.error(err.message || "Failed to delete KYC data");
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 File Handler
  const handleFileChange = (key) => (e) => {
    const file = e.target.files?.[0];
    console.log(`[KYC] File selected for ${key}:`, file);

    if (!file) {
      console.log(`[KYC] No file selected for ${key}`);
      return;
    }

    // Validate file size (3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error(`File must be smaller than 3MB (${(file.size / 1024 / 1024).toFixed(2)}MB detected)`);
      e.target.value = "";
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, or WebP)");
      e.target.value = "";
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    setFiles((prev) => ({ ...prev, [key]: file }));
    setFilePreviews((prev) => ({ ...prev, [key]: previewUrl }));

    console.log(`[KYC] File set for ${key}:`, file.name);
  };

  // 🔹 Clear file input function
  const clearFileInput = (key) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
    setFilePreviews((prev) => {
      if (prev[key]) {
        URL.revokeObjectURL(prev[key]);
      }
      return { ...prev, [key]: null };
    });
  };

  // 🔹 Clean up preview URLs
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [filePreviews]);

  // 🔹 Check if all required files are uploaded
  const areFilesUploaded = () => {
    const requiredFiles = ['passport', 'id_front', 'id_back'];
    return requiredFiles.every(key => files[key] !== null);
  };

  // 🔹 Submit KYC
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    const { passport, id_front, id_back } = files;
    const { document_type, document_number } = form;

    console.log("[KYC] Form validation:", {
      document_type,
      document_number,
      passport: !!passport,
      id_front: !!id_front,
      id_back: !!id_back
    });

    // Validation
    if (!document_type || !document_number) {
      return toast.error("Please fill in all document details");
    }

    if (!passport || !id_front || !id_back) {
      const missingFiles = [];
      if (!passport) missingFiles.push("Selfie with ID");
      if (!id_front) missingFiles.push("ID Front Side");
      if (!id_back) missingFiles.push("ID Back Side");

      toast.error(`Please upload: ${missingFiles.join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      // Append files with correct field names
      formData.append("selfie_image", passport);
      formData.append("front_image", id_front);
      formData.append("back_image", id_back);
      formData.append("document_type", document_type);
      formData.append("document_number", document_number);

      console.log("[KYC] FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `${value.name} (${value.type})` : value);
      }

      const url = editing && kycData?.id
        ? `${BASE_URL}/documents/${kycData.id}/`
        : `${BASE_URL}/documents/`;

      const method = editing && kycData?.id ? "PUT" : "POST";

      console.log("[KYC] Submitting to:", url, "Method:", method);

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseText = await res.text();
      console.log("[KYC] Response status:", res.status);
      console.log("[KYC] Response text:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("[KYC] JSON parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      if (res.ok) {
        toast.success(editing ? "KYC updated successfully!" : "KYC submitted for review!");
        setKycData(data);
        setHasKyc(true);
        setEditing(false);

        // Clear files and previews
        setFiles({ passport: null, id_front: null, id_back: null });
        setFilePreviews({ passport: null, id_front: null, id_back: null });

        // Refresh KYC status
        await fetchKycStatus(token);
      } else {
        const errorMsg = data.detail ||
          data.error ||
          data.message ||
          (typeof data === 'string' ? data : "Submission failed");
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("[KYC] Submission error:", err);
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Get Status Display
  const getStatusDisplay = (status) => {
    const statusConfig = {
      pending: {
        icon: <FiClock className="text-[#14B9B5]" size={20} />,
        color: "text-[#14B9B5]",
        bgColor: "bg-white",
        borderColor: "border-[#14B9B5]",
        label: "Under Review"
      },
      verified: {
        icon: <FiCheckCircle className="text-[#14B9B5]" size={20} />,
        color: "text-[#14B9B5]",
        bgColor: "bg-white",
        borderColor: "border-[#14B9B5]",
        label: "Verified"
      },
      approved: {
        icon: <FiCheckCircle className="text-[#14B9B5]" size={20} />,
        color: "text-[#14B9B5]",
        bgColor: "bg-white",
        borderColor: "border-[#14B9B5]",
        label: "Approved"
      },
      rejected: {
        icon: <FiXCircle className="text-[#14B9B5]" size={20} />,
        color: "text-[#14B9B5]",
        bgColor: "bg-white",
        borderColor: "border-[#14B9B5]",
        label: "Rejected"
      },
      failed: {
        icon: <FiXCircle className="text-[#14B9B5]" size={20} />,
        color: "text-[#14B9B5]",
        bgColor: "bg-white",
        borderColor: "border-[#14B9B5]",
        label: "Failed"
      }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        {config.icon}
        <span className={`font-semibold ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  };

  // 🔹 Format document type for display
  const formatDocumentType = (type) => {
    const typeMap = {
      passport: "Passport",
      id_card: "National ID Card",
      drivers_license: "Driver's License"
    };
    return typeMap[type] || type;
  };

  // 🔹 Format document number for security
  const formatDocumentNumber = (number, showFull = false) => {
    if (!number) return "Not provided";
    if (showFull) return number;

    // Show first 4 and last 4 characters, mask the rest
    if (number.length <= 8) return number;
    return `${number.substring(0, 4)}****${number.substring(number.length - 4)}`;
  };

  // 🔹 File Upload Component matching the design
  const FileUploadArea = ({ label, name, required = false }) => (
    <div className="space-y-3 p-4 border border-gray-300 rounded-lg bg-white">
      <label className="block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-[#14B9B5]">*</span>}
      </label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#14B9B5] transition-colors bg-white">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange(name)}
          className="hidden"
          id={`file-upload-${name}`}
          required={required && !files[name]}
        />

        {!files[name] ? (
          <label
            htmlFor={`file-upload-${name}`}
            className="cursor-pointer block"
          >
           <img src="/assets/upload.png" alt="USDC" className="w-10 mx-auto mb-3 h-10 text-[#14B9B5]" />
            <p className="text-sm text-gray-600 mb-1">
              <span className="text-[#14B9B5] font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">JPG, PNG, WebP (Max 3MB)</p>
          </label>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-3 border border-gray-300 rounded overflow-hidden bg-white">
              <img
                src={filePreviews[name]}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-gray-700 mb-2">{files[name]?.name}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById(`file-upload-${name}`).click()}
                className="text-[#14B9B5] text-sm font-medium hover:text-[#0d8684]"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => clearFileInput(name)}
                className="text-[#14B9B5] text-sm font-medium hover:text-[#0d8684]"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14B9B5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your KYC status...</p>
        </div>
      </div>
    );
  }

  // 🔹 Show KYC Status if user has submitted KYC
  if (hasKyc && kycData && !editing) {
    const status = kycData.status || kycData.verification_status || 'pending';
    const submittedDate = kycData.created_at ? new Date(kycData.created_at).toLocaleDateString() : 'N/A';

    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg text-[#00615F]">KYC Verification</h1>
            <p className="text-[#14B9B5] mt-2">Your identity verification status</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-[#14B9B5] p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-[#00615F] mb-2">
                  Verification Status
                </h2>
                <p className="text-[#14B9B5]">
                  {status === 'verified' || status === 'approved'
                    ? "Your identity has been successfully verified. You can now access all platform features."
                    : status === 'rejected' || status === 'failed'
                      ? "Your submission requires attention. Please update your documents."
                      : "Your documents are under review. This usually takes 1-2 business days."}
                </p>
              </div>
              {getStatusDisplay(status)}
            </div>

            {/* Document Information */}
            <div className="mt-6 border-t border-[#14B9B5] pt-6">
              <h3 className="text-lg font-semibold text-[#00615F] mb-4">Submitted Documents</h3>

              <div className=" gap-4">
                {/* Document Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#14B9B5]">
                    <span className="text-sm font-medium text-[#00615F]">Document Type:</span>
                    <span className="text-sm text-[#00615F] font-semibold">
                      {formatDocumentType(kycData.document_type)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#14B9B5]">
                    <span className="text-sm font-medium text-[#00615F]">Document Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#00615F] font-mono">
                        {formatDocumentNumber(kycData.document_number, showDocumentNumber)}
                      </span>
                      <button
                        onClick={() => setShowDocumentNumber(!showDocumentNumber)}
                        className="text-[#14B9B5] hover:text-[#00615F] transition-colors"
                      >
                        {showDocumentNumber ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[#14B9B5]">
                    <span className="text-sm font-medium text-[#00615F]">Submitted:</span>
                    <span className="text-sm text-[#00615F]">{submittedDate}</span>
                  </div>
                </div>

              </div>

              {/* Quick Image Previews */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {kycData.selfie_image && (
                  <div className="text-center">
                    <p className="text-xs text-[#00615F] mb-1">Selfie Preview</p>
                    <div className="w-full h-60 bg-white rounded-lg border border-[#14B9B5] flex items-center justify-center overflow-hidden">
                      <img
                        src={kycData.selfie_image}
                        alt="Selfie preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {kycData.front_image && (
                  <div className="text-center">
                    <p className="text-xs text-[#00615F] mb-1">Front Side Preview</p>
                    <div className="w-full h-60 bg-white rounded-lg border border-[#14B9B5] flex items-center justify-center overflow-hidden">
                      <img
                        src={kycData.front_image}
                        alt="Front side preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {kycData.back_image && (
                  <div className="text-center">
                    <p className="text-xs text-[#00615F] mb-1">Back Side Preview</p>
                    <div className="w-full h-60 bg-white rounded-lg border border-[#14B9B5] flex items-center justify-center overflow-hidden">
                      <img
                        src={kycData.back_image}
                        alt="Back side preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col  sm:flex-row justify-between mt-6">
              <button
                onClick={() => {
                  setForm({
                    document_type: kycData.document_type || "passport",
                    document_number: kycData.document_number || "",
                  });
                  setEditing(true);
                }}
                className="flex items-center justify-center mb-3 gap-2 bg-[#14B9B5] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d8684] transition-colors"
              >
                <FiEdit size={16} />
                Update Documents
              </button>

              {/* DELETE BUTTON */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex items-center justify-center gap-2 mb-3  bg-white border border-[#14B9B5] text-[#14B9B5] py-2 px-4 rounded-lg font-semibold hover:bg-[#14B9B5] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={16} />
                {deleting ? "Deleting..." : "Delete KYC"}
              </button>

              <button
                onClick={() => router.push("/home")}
                className="flex items-center justify-center gap-2 mb-3  bg-white border border-[#14B9B5] text-[#14B9B5] py-2 px-4 rounded-lg font-semibold hover:bg-[#14B9B5] hover:text-white transition-colors"
              >
                <FiHome size={16} />
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-white border border-[#14B9B5] mb-4">
                  <FiTrash2 className="h-6 w-6 text-[#14B9B5]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete KYC Data?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete your KYC submission? This action cannot be undone and you'll need to submit new documents for verification.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDeleteKyc}
                    disabled={deleting}
                    className="flex-1 bg-[#14B9B5] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d8684] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 bg-white border border-[#14B9B5] text-[#14B9B5] py-2 px-4 rounded-lg font-semibold hover:bg-[#14B9B5] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🔹 KYC Form for new users (matches the image design exactly)
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with user name */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome{userData?.first_name ? `, ${userData.first_name} ${userData.last_name}` : ''}
          </h1>
          <p className="text-gray-600 mt-1">Complete your KYC verification to get started</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Documents and Selfie Section */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Documents and selfie</h3>

              <div className="space-y-6">
                {/* Document Type Selection */}
                <div className="p-4 border border-gray-300 rounded-lg bg-white">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Document Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Document of verification
                      </label>
                      <div className="relative">
                        <select
                          value={form.document_type}
                          onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                          className="w-full p-3 border border-[#14B9B5] rounded-lg bg-white focus:border-[#14B9B5] focus:ring-2 focus:ring-[#14B9B5] focus:ring-opacity-20 appearance-none cursor-pointer text-gray-900 font-medium transition-colors"
                        >
                          <option value="passport">Passport</option>
                          <option value="id_card">National ID Card</option>
                          <option value="drivers_license">Driver's License</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#14B9B5]">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Document Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Document number
                      </label>
                      <div>
                        <input
                          type="text"
                          placeholder="Enter your document number"
                          value={form.document_number}
                          onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14B9B5] focus:border-transparent text-lg font-mono transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload Sections */}
                <FileUploadArea
                  label="Image upload"
                  name="passport"
                  required
                />

                <FileUploadArea
                  label="Image of selected document"
                  name="id_front"
                  required
                />

                <FileUploadArea
                  label="Back side of document"
                  name="id_back"
                  required
                />
              </div>
            </div>



            {/* Submit Button */}
            <div className="flex flex-row gap-2 pt-6 border-t border-gray-300">
              <button
                type="submit"
                disabled={uploading || !areFilesUploaded()}
                className="flex-1 bg-[#14B9B5] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d8684] transition-colors  disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm min-w-0"
              >
                <FiUpload size={16} />
                {uploading ? "Uploading..." : "Submit"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/home")}
                className="flex-1 bg-white border border-[#14B9B5] text-[#14B9B5] py-2 px-3 rounded-lg font-semibold hover:bg-[#14B9B5] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm min-w-0"
              >
                <FiHome size={16} />
                Back
              </button>
            </div>

            {!areFilesUploaded() && (
              <p className="text-center text-sm text-[#14B9B5] mt-4">
                Please upload all required documents before submitting
              </p>
            )}
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team for assistance with KYC verification.
          </p>
        </div>
      </div>
    </div>
  );
}
