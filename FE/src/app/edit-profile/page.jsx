"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const getAccessToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  // 🔹 Fetch user profile
  useEffect(() => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      toast.error("Please log in to continue");
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setInitialLoad(true);
        console.log("Fetching profile...");
        
        const res = await fetch(
          "https://credlend.pythonanywhere.com/api/users/profile/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        console.log("Profile response status:", res.status);
        
        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("accessToken");
            router.push("/login");
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Profile data received:", data);
        
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile. Please try again.");
      } finally {
        setInitialLoad(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 TEST: Try different endpoints and methods
  const handleSubmit = async (e) => {
    e.preventDefault();
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      toast.error("You are not logged in.");
      router.push("/login");
      return;
    }

    // Validation
    if (!profile.first_name?.trim() || !profile.last_name?.trim() || !profile.email?.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    // Try different endpoints and methods
    const endpoints = [
      "https://credlend.pythonanywhere.com/api/users/profile/update/",
      "https://credlend.pythonanywhere.com/api/users/profile/", // Try updating via profile endpoint
    ];

    const methods = ["PUT", "PATCH", "POST"];

    for (const endpoint of endpoints) {
      for (const method of methods) {
        try {
          console.log(`Trying ${method} request to: ${endpoint}`);
          
          const res = await fetch(endpoint, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              first_name: profile.first_name.trim(),
              last_name: profile.last_name.trim(),
              email: profile.email.trim(),
            }),
          });

          console.log(`${method} ${endpoint} - Status:`, res.status);
          
          const responseText = await res.text();
          console.log(`${method} ${endpoint} - Response:`, responseText);

          let data = {};
          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.log("Response is not JSON:", responseText);
          }

          if (res.ok) {
            toast.success("Profile updated successfully!");
            setTimeout(() => {
              router.push("/profile");
            }, 1500);
            return; // Success, exit the function
          }

          // If we get a 404 or 405, try next endpoint/method
          if (res.status === 404 || res.status === 405) {
            console.log(`${method} ${endpoint} not available, trying next...`);
            continue;
          }

          // Handle other errors
          if (res.status === 400) {
            const errorMsg = data.email?.[0] || data.detail || "Please check your input";
            toast.error(errorMsg);
            return;
          } else if (res.status === 401) {
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("accessToken");
            router.push("/login");
            return;
          }

        } catch (error) {
          console.error(`Error with ${method} ${endpoint}:`, error);
          // Continue to next attempt
        }
      }
    }

    // If all attempts failed
    toast.error("Unable to update profile. The update feature might be temporarily unavailable.");
    setLoading(false);
  };

  // 🔹 ALTERNATIVE: Use the profile list endpoint with PUT/PATCH
  const tryAlternativeUpdate = async () => {
    const accessToken = getAccessToken();
    
    try {
      console.log("Trying alternative update via profile endpoint...");
      
      // Try to update using the profile endpoint directly
      const res = await fetch(
        "https://credlend.pythonanywhere.com/api/users/profile/",
        {
          method: "PUT", // or PATCH
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(profile),
        }
      );

      console.log("Alternative update status:", res.status);
      return res.ok;
    } catch (error) {
      console.error("Alternative update error:", error);
      return false;
    }
  };

  // Loading state
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10 flex items-center justify-center">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Edit Profile
        </h1>
        <p className="text-gray-600 mb-6">
          Update your personal information
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
              placeholder="Enter email address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg text-white font-medium shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(180deg, #14B9B5 0%, #0ea79b 100%)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}