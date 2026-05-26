// Add these routes to your src/App.jsx
// Your App.jsx should look like this:

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import ForgotPassword from "./pages/Forgotpassword.jsx";
import Signup from "./pages/Signup";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/users_managers/AdminUsers";
import AdminUserDetail from "./pages/admin/users_managers/AdminUserDetail";
import AdminAssociations from "./pages/admin/users_managers/AdminAssociations";
import AdminCampaigns from "./pages/admin/campaigns/AdminCampaigns";
import CampaignDetail from "./pages/admin/campaigns/CampaignDetail";

import CampaignsList from "./pages/campaigns/Campaignslist";
import CampaignForm from "./pages/campaigns/Campaignform";
import AssociationDashboard from "./pages/association/Dashboard";
import AssociationProfile from "./pages/association/Profile";
import AssociationSettings from "./pages/association/Settings";
import AssociationLayout from "./pages/association/AssociationLayout";
import AssociationCampaigns from "./pages/association/AssociationCompains";
import LandingPage from "./pages/LandingPage";
import DonorDashboard from "./pages/donor/DonorDashboard.jsx";
import DonatePage from "./pages/donor/DonatePage.jsx";
import DonationHistory from "./pages/donor/DonationHistory.jsx";
import DonorLayout from "./pages/donor/DonorLayout.jsx";
import DonateObjects from "./pages/donor/DonateObjects";
import DonorProfile from "./pages/donor/DonorProfile";
import DonorCampaigns from "./pages/donor/DonorCompaigns";
import DonorCampaignDetail from "./pages/donor/DonorCampaignDetail";
import Messages from "./pages/donor/Messages";
import AssociationMessages from "./pages/association/Messages";
import AssociationObjectDonations from "./pages/association/Associationdonations";
//import AssociationAppointments    from "./pages/association/AssociationAppointments";
import DonorObjectDonations from "./pages/donor/DonorObjectDonations";
 import { DonorProvider } from "./contexts/DonorContext";
 import AdminReviews from "./pages/admin/AdminReviews";
import MyReview from "./pages/donor/my-review.jsx";
import AssociationMyReview from "./pages/association/my-review.jsx";
import Reclamation from "./pages/donor/Reclamation.jsx";
import AssociationReclamation from "./pages/association/Reclamation.jsx";
import AdminReclamations from "./pages/admin/AdminReclamations";
import AssociationMyClaims from "./pages/association/Myclaims";
import MyClaims from "./pages/donor/Myclaims";
import { NotificationBell } from "./components/NotificationBell";
import Notifications from "./pages/association/Notifications";
import AdminNotifications from "./pages/admin/Notifications";
import DonorNotifications from "./pages/donor/Notifications";
import AssociationCampaignDetail from "./pages/association/AssociationCampaignDetail.jsx";
import EditCampaign from "./pages/association/EditCampaign.jsx";
import CampaignItemDonate from "./pages/donor/CampaignItemDonate";
import DonorAppointments from "./pages/donor/DonorAppointments";
import AssociationAppointments from "./pages/association/AssociationAppointments";
import AssociationDonorsList from "./pages/association/AssociationDonorsList";

export default function App() {
  // Clean up duplicate Google Maps scripts on app initialization
  useEffect(() => {
    const scripts = document.querySelectorAll(
      'script[src*="maps.googleapis.com"]',
    );
    if (scripts.length > 1) {
      // Keep only the first one, remove duplicates
      scripts.forEach((script, index) => {
        if (index > 0) {
          script.remove();
        }
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Donor routes ── */}
    

<Route
  path="/donor"
  element={
    <DonorProvider>
      <DonorLayout />
    </DonorProvider>
  }
>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<DonorDashboard />} />
  <Route path="history" element={<DonationHistory />} />
  <Route path="donate-objects" element={<DonateObjects />} />
  <Route path="messages" element={<Messages />} />
  <Route path="profile" element={<DonorProfile />} /> {/* ✅ FIXED */}
  <Route path="donate/:campaignId" element={<DonatePage />} />
  <Route path="campaigns" element={<DonorCampaigns />} />
  <Route path="campaigns/:id" element={<CampaignDetail />} />
  <Route path="my-review" element={<MyReview />} />
  <Route path="object-donations-list" element={<DonorObjectDonations />} />
  <Route path="claim" element={<Reclamation />} />
  <Route path="claims/my" element={<MyClaims />} />
     <Route path="notifications" element={<NotificationBell />} />
  <Route path="my_notifications" element={<DonorNotifications />} />
  <Route path="donate-campaign-item" element={<CampaignItemDonate />} />
  <Route path="appointments" element={<DonorAppointments />} />
</Route>

<Route path="/donate/:campaignId" element={<Navigate to="/donor/dashboard" replace />}/>

        {/* ── Public routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/campaigns" element={<CampaignsList />} />

        <Route path="/association" element={<AssociationLayout />}>
          <Route path="dashboard" element={<AssociationDashboard />} />
          <Route path="campaigns" element={<AssociationCampaigns />} />
           <Route path="campaigns/:id" element={<AssociationCampaignDetail />} />
            <Route path="edit/:id" element={<EditCampaign />} />

          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<AssociationProfile />} />
          <Route path="settings" element={<AssociationSettings />} />
          <Route path="my-review" element={<MyReview />} />
            <Route path="object-donations" element={<AssociationObjectDonations />} />
            <Route path="claim" element={<Reclamation />} />
            <Route path="claims/my" element={<AssociationMyClaims />} />
          <Route path="campaigns/create" element={<CampaignForm />} />
          <Route path="campaigns/:id/edit" element={<CampaignForm />} />
          <Route path="notifications" element={<NotificationBell />} />
          <Route path="my_notifications" element={<Notifications/>} />
          <Route path="appointments" element={<AssociationAppointments />} />
          <Route path="donors" element={<AssociationDonorsList />} />

        </Route>

        {/* ── Admin routes (nested under sidebar layout) ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="associations" element={<AdminAssociations />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="claims" element={<AdminReclamations />} />
            <Route path="notifications" element={<NotificationBell />} />
         <Route path="my_notifications" element={<AdminNotifications />} />
        </Route>

        {/* ── Default redirect ── */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}