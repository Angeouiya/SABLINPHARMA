"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { HomeView } from "@/components/views/home-view";
import { MedicationsView } from "@/components/views/medications-view";
import { MedicationDetailView } from "@/components/views/medication-detail-view";
import { PharmaciesView } from "@/components/views/pharmacies-view";
import { PharmacyDetailView } from "@/components/views/pharmacy-detail-view";
import { PrescriptionView } from "@/components/views/prescription-view";
import { ProfileView } from "@/components/views/profile-view";
import { AuthView } from "@/components/views/auth-view";
import { SubscriptionView } from "@/components/views/subscription-view";
import { PaymentView } from "@/components/views/payment-view";
import { SuccessView } from "@/components/views/success-view";

export default function Home() {
  const { view } = useNav();
  const fetchMe = useAuth((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

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
        {view === "profile" && <ProfileView />}
        {view === "auth" && <AuthView />}
        {view === "subscription" && <SubscriptionView />}
        {view === "payment" && <PaymentView />}
        {view === "success" && <SuccessView />}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
