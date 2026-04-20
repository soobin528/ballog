import { HeroSection } from "@/components/hero-section";
import { PageShell } from "@/components/page-shell";
import { RecentTicketPreview } from "@/components/recent-ticket-preview";
import { type Entry, fetchEntries } from "@/lib/api";

export default async function HomePage() {
  let entries: Entry[] = [];
  let error: string | null = null;

  try {
    const data = await fetchEntries();
    entries = data.slice(-3).reverse();
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "최근 티켓을 불러오지 못했습니다.";
  }

  return (
    <PageShell>
      <HeroSection />
      <RecentTicketPreview entries={entries} error={error} />
    </PageShell>
  );
}
