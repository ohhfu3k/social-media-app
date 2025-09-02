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
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/search" element={<Search />} />
            <Route path="/messages" element={<Messaging />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/post/:id" element={<PostDetails />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile/view/:username" element={<UserProfileView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/add/:userId" element={<Stories />} />
            <Route path="/stories/view/:userId" element={<StoriesView />} />
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
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
