import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import ForgotPassword from "./pages/ForgotPassword";
import Search from "./pages/Search";
import Messaging from "./pages/Messaging";
import CreatePost from "./pages/CreatePost";
import PostDetails from "./pages/PostDetails";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import UserProfileView from "./pages/UserProfileView";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import Groups from "./pages/Groups";
import Stories from "./pages/Stories";
import StoriesView from "./pages/StoriesView";
import BlipsView from "./pages/BlipsView";
import Leaderboard from "./pages/Leaderboard";
import Error500 from "./pages/Error500";
import Onboarding from "./pages/Onboarding";
import Analytics from "./pages/Analytics";
import Badges from "./pages/Badges";
import Events from "./pages/Events";
import Live from "./pages/Live";
import Support from "./pages/Support";
import Marketplace from "./pages/Marketplace";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import Reels from "./pages/Reels";
import DirectThread from "./pages/DirectThread";
import PostPDetails from "./pages/PostPDetails";
import PostComments from "./pages/PostComments";
import OAuthStart from "./pages/OAuthStart";
import VerifyEmail from "./pages/VerifyEmail";
import IdentityVerify from "./pages/IdentityVerify";
import AppealSuspended from "./pages/AppealSuspended";
import LoginMagicLink from "./pages/LoginMagicLink";
import LoginSMS from "./pages/LoginSMS";
import LoginTwoFactor from "./pages/LoginTwoFactor";
import SettingsSecurity from "./pages/SettingsSecurity";
import SettingsPrivacy from "./pages/SettingsPrivacy";
import SettingsNotifications from "./pages/SettingsNotifications";
import SettingsAccountDelete from "./pages/SettingsAccountDelete";
import SettingsAccountExport from "./pages/SettingsAccountExport";
import SettingsConnectedApps from "./pages/SettingsConnectedApps";
import { AppStateProvider } from "./context/app-state";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppStateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Index />} />
            <Route path="/login/passwordless" element={<LoginMagicLink />} />
            <Route path="/login/sms" element={<LoginSMS />} />
            <Route path="/login/twofactor" element={<LoginTwoFactor />} />
            <Route path="/signup" element={<Index />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/search" element={<Search />} />
            <Route path="/messages" element={<Messaging />} />
            <Route path="/direct/inbox" element={<Messaging />} />
            <Route path="/direct/thread/:id" element={<DirectThread />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/create/post" element={<CreatePost />} />
            <Route path="/create/story" element={<Stories />} />
            <Route path="/create/reel" element={<Reels />} />
            <Route path="/live/start" element={<Live />} />
            <Route path="/post/:id" element={<PostDetails />} />
            <Route path="/p/:postId" element={<PostPDetails />} />
            <Route path="/p/:postId/comments" element={<PostComments />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/view/:username" element={<UserProfileView />} />
            <Route path="/profile/:username" element={<UserProfileView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/security" element={<SettingsSecurity />} />
            <Route path="/settings/privacy" element={<SettingsPrivacy />} />
            <Route path="/settings/notifications" element={<SettingsNotifications />} />
            <Route path="/settings/account/delete" element={<SettingsAccountDelete />} />
            <Route path="/settings/account/export" element={<SettingsAccountExport />} />
            <Route path="/settings/connected-apps" element={<SettingsConnectedApps />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/add/:userId" element={<Stories />} />
            <Route path="/stories/view/:userId" element={<StoriesView />} />
            <Route path="/stories/:userId/:storyId" element={<StoriesView />} />
            <Route path="/blips" element={<BlipsView />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/500" element={<Error500 />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/events" element={<Events />} />
            <Route path="/live" element={<Live />} />
            <Route path="/support" element={<Support />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/shop" element={<Marketplace />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login/oauth/:provider" element={<OAuthStart />} />
            <Route path="/signup/verify-email" element={<VerifyEmail />} />
            <Route path="/verify/identity" element={<IdentityVerify />} />
            <Route path="/appeal/suspended" element={<AppealSuspended />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
