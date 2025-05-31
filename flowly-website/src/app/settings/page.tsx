"use client";
import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const session = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    const fetchData = async () => {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", session.user.id)
        .single();
      setProfile(profileData);
      setEmail(profileData?.email || "");
      // Fetch subscription info
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("status, plan_type, stripe_customer_id, current_period_end, created_at, plan_type, current_period_end")
        .eq("user_id", session.user.id)
        .single();
      setSubscription(subData);
      setLoading(false);
    };
    fetchData();
  }, [session?.user?.id]);

  const handleManageBilling = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error("No Stripe customer ID found.");
      return;
    }
    setPortalLoading(true);
    try {
      const res = await fetch("/api/create-customer-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: subscription.stripe_customer_id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to open billing portal.");
      }
    } catch (err) {
      toast.error("Failed to open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      // Delete from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(session.user.id);
      if (authError) throw authError;
      // Optionally, delete from profiles and subscriptions tables
      await supabase.from("profiles").delete().eq("id", session.user.id);
      await supabase.from("subscriptions").delete().eq("user_id", session.user.id);
      toast.success("Account deleted. Goodbye!");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("Email updated! Please check your inbox to confirm.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated!");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-[#0f172a] mb-8">Settings</h1>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Account Info</h2>
        <div className="mb-2 text-[#0f172a]">Name: <span className="font-medium">{profile?.full_name}</span></div>
        <div className="mb-2 text-[#0f172a]">Email: <span className="font-medium">{profile?.email}</span></div>
        <div className="mb-2 text-[#0f172a]">Plan: <span className="font-medium">{profile?.role === 'pro_user' ? 'Pro' : 'Free'}</span></div>
        {subscription?.stripe_customer_id && (
          <div className="mb-2 text-xs text-[#64748b]">Stripe Customer ID: <span className="font-mono">{subscription.stripe_customer_id}</span></div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Subscription</h2>
        {profile?.role === 'pro_user' && subscription ? (
          <>
            <div className="mb-2 text-[#0f172a]">Status: <span className="font-medium capitalize">{subscription.status}</span></div>
            <div className="mb-2 text-[#0f172a]">Plan Type: <span className="font-medium capitalize">{subscription.plan_type}</span></div>
            {subscription.created_at && (
              <div className="mb-2 text-[#0f172a]">Started: <span className="font-medium">{new Date(subscription.created_at).toLocaleDateString()}</span></div>
            )}
            {subscription.current_period_end && (
              <div className="mb-2 text-[#0f172a]">Renews: <span className="font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>
            )}
            {/* Next payment amount is not stored locally, so link to portal for full billing info */}
            <a
              href="#"
              onClick={handleManageBilling}
              className="mt-2 inline-block text-[#22c55e] hover:underline"
            >
              View billing history & invoices
            </a>
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="mt-4 bg-[#22c55e] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing / Cancel Subscription'}
            </button>
          </>
        ) : (
          <div className="text-[#64748b]">You are on the Free plan.</div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Change Email</h2>
        <form onSubmit={handleChangeEmail} className="flex gap-2 items-end">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors text-base bg-white shadow-sm"
            required
          />
          <button
            type="submit"
            disabled={emailLoading}
            className="bg-[#22c55e] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {emailLoading ? 'Saving...' : 'Update Email'}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="flex gap-2 items-end">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors text-base bg-white shadow-sm"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={passwordLoading}
            className="bg-[#22c55e] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {passwordLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteLoading ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
} 