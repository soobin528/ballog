import { CreateEntryForm } from "@/components/create-entry-form";
import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";
import { fetchGames, fetchUsers } from "@/lib/api";

export default async function CreatePage() {
  try {
    const [users, games] = await Promise.all([fetchUsers(), fetchGames()]);

    if (users.length === 0 || games.length === 0) {
      return (
        <PageShell>
          <InlineState
            title="먼저 기본 데이터가 필요해요."
            description="사용자와 경기 데이터가 있어야 직관 기록을 만들 수 있습니다."
          />
        </PageShell>
      );
    }

    return (
      <PageShell>
        <CreateEntryForm games={games} users={users} />
      </PageShell>
    );
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "폼 데이터를 불러오지 못했습니다.";

    return (
      <PageShell>
        <InlineState
          tone="error"
          title="입력 폼을 준비하지 못했어요."
          description={message}
        />
      </PageShell>
    );
  }
}
