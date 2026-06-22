"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { useFavorites } from "@/store/favorites";
import { useHistory } from "@/store/history";
import { useCredits } from "@/store/credits";
import { HomeView } from "@/components/views/home-view";
import { MedicationsView } from "@/components/views/medications-view";
import { MedicationDetailView } from "@/components/views/medication-detail-view";
import { PharmaciesView } from "@/components/views/pharmacies-view";
import { PharmacyDetailView } from "@/components/views/pharmacy-detail-view";
import { PrescriptionView } from "@/components/views/prescription-view";
import { PrescriptionResultView } from "@/components/views/prescription-result-view";
import { ProfileView } from "@/components/views/profile-view";
import { AuthView } from "@/components/views/auth-view";
import { SubscriptionView } from "@/components/views/subscription-view";
import { PaymentView } from "@/components/views/payment-view";
import { SuccessView } from "@/components/views/success-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { UserRequestsView } from "@/components/views/user-requests-panels";
import { HistoryView } from "@/components/views/history-view";
import { FavoritesView } from "@/components/views/favorites-view";
import { SettingsView } from "@/components/views/settings-view";
import { DesignSystemView } from "@/components/views/design-system-view";
import { WalletView } from "@/components/views/wallet-view";
import type { View } from "@/lib/types";

export function UserRouteShell({ initialView = "home" }: { initialView?: View }) {
  const { view, navigate } = useNav();
  const fetchMe = useAuth((s) => s.fetchMe);
  const user = useAuth((s) => s.user);
  const sessionChecked = useAuth((s) => s.sessionChecked);
  const fetchNotifs = useNotifications((s) => s.fetch);
  const resetNotifs = useNotifications((s) => s.reset);
  const fetchFavs = useFavorites((s) => s.fetch);
  const resetFavs = useFavorites((s) => s.reset);
  const fetchHistory = useHistory((s) => s.fetch);
  const resetHistory = useHistory((s) => s.reset);
  const fetchCredits = useCredits((s) => s.fetch);
  const resetCredits = useCredits((s) => s.reset);

  useEffect(() => {
    try {
      window.localStorage.removeItem("sablin-auth");
    } catch {
      /* noop */
    }
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (initialView !== "home") navigate(initialView);
  }, [initialView, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifs();
      fetchFavs();
      fetchHistory();
      fetchCredits();
    } else if (sessionChecked) {
      resetNotifs();
      resetFavs();
      resetHistory();
      resetCredits();
    }
  }, [
    user,
    sessionChecked,
    fetchNotifs,
    fetchFavs,
    fetchHistory,
    fetchCredits,
    resetNotifs,
    resetFavs,
    resetHistory,
    resetCredits,
  ]);

  return (
    <div className="sablin-user-ui flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {view === "home" && <HomeView />}
        {view === "medications" && <MedicationsView />}
        {view === "medication-detail" && <MedicationDetailView />}
        {view === "pharmacies" && <PharmaciesView />}
        {view === "pharmacy-detail" && <PharmacyDetailView />}
        {view === "prescription" && <PrescriptionView />}
        {view === "prescription-result" && <PrescriptionResultView />}
        {view === "profile" && <ProfileView />}
        {view === "auth" && <AuthView />}
        {view === "subscription" && <SubscriptionView />}
        {view === "payment" && <PaymentView />}
        {view === "success" && <SuccessView />}
        {view === "notifications" && <NotificationsView />}
        {view === "requests" && <UserRequestsView />}
        {view === "history" && <HistoryView />}
        {view === "favorites" && <FavoritesView />}
        {view === "settings" && <SettingsView />}
        {view === "design-system" && <DesignSystemView />}
        {view === "wallet" && <WalletView />}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
