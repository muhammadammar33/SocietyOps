import { AppHeader } from "../components/home/AppHeader";
import { LandingSection } from "../components/home/LandingSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="grid-bg flex flex-1 flex-col gap-0">
        <AppHeader
          title="SocietyOps"
          subtitle="A professional platform to digitize community operations, governance, and service delivery."
        />
        <LandingSection />
      </div>
    </main>
  );
}
