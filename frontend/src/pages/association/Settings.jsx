import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AssociationSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    campaignUpdates: true,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored || stored.role !== "association") {
      navigate("/login");
      return;
    }
    setUser(stored);

    // Load settings from localStorage
    const savedSettings = JSON.parse(
      localStorage.getItem("associationSettings") || "{}",
    );
    setSettings({ ...settings, ...savedSettings });
  }, [navigate]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem("associationSettings", JSON.stringify(settings));
    setMessage("Settings saved successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/association/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-slate-300 mt-1">
              Manage your notification preferences and account settings
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {message && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-medium text-sm">
                ✓ {message}
              </div>
            )}

            {/* Notifications Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                📧 Notifications
              </h3>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Email Notifications
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Receive updates via email for campaigns and donations
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("emailNotifications")}
                    className={`relative inline-flex h-6 w-11 rounded-full transition ${
                      settings.emailNotifications
                        ? "bg-blue-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        settings.emailNotifications
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">
                      SMS Notifications
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Get SMS alerts for urgent donation requests
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("smsNotifications")}
                    className={`relative inline-flex h-6 w-11 rounded-full transition ${
                      settings.smsNotifications ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        settings.smsNotifications
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Weekly Reports */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Weekly Reports
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Get weekly summary reports of your campaigns
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("weeklyReports")}
                    className={`relative inline-flex h-6 w-11 rounded-full transition ${
                      settings.weeklyReports ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        settings.weeklyReports
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Campaign Updates */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Campaign Updates
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Notify donors about your campaign progress
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("campaignUpdates")}
                    className={`relative inline-flex h-6 w-11 rounded-full transition ${
                      settings.campaignUpdates ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        settings.campaignUpdates
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                🔐 Account
              </h3>

              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition">
                  <p className="font-semibold text-slate-800">
                    Change Password
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Update your account password
                  </p>
                </button>

                <button className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition">
                  <p className="font-semibold text-slate-800">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Enable extra security for your account
                  </p>
                </button>

                <button className="w-full text-left px-4 py-3 bg-red-50 rounded-lg border border-red-100 hover:border-red-200 hover:bg-red-100 transition">
                  <p className="font-semibold text-red-600">Delete Account</p>
                  <p className="text-sm text-red-500 mt-1">
                    Permanently delete your account and all data
                  </p>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 justify-end border-t border-slate-100 pt-6">
              <button
                onClick={() => navigate("/association/dashboard")}
                className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-500 rounded-lg font-semibold text-white hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
