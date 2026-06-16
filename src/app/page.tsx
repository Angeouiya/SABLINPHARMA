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
import { HistoryView } from "@/components/views/history-view";
import { FavoritesView } from "@/components/views/favorites-view";
import { SettingsView } from "@/components/views/settings-view";
import { DesignSystemView } from "@/components/views/design-system-view";

export default function Home() {
  const { view } = useNav();
  const fetchMe = useAuth((s) => s.fetchMe);
  const user = useAuth((s) => s.user);
  const fetchNotifs = useNotifications((s) => s.fetch);
  const fetchFavs = useFavorites((s) => s.fetch);
  const fetchHistory = useHistory((s) => s.fetch);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Fetch user-scoped data once the user is known
  useEffect(() => {
    if (user) {
      fetchNotifs();
      fetchFavs();
      fetchHistory();
    }
  }, [user, fetchNotifs, fetchFavs, fetchHistory]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
        {view === "history" && <HistoryView />}
        {view === "favorites" && <FavoritesView />}
        {view === "settings" && <SettingsView />}
        {view === "design-system" && <DesignSystemView />}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
