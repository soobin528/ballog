import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";
import type { Entry, User } from "@/lib/api";
import { fetchEntries, fetchUsers } from "@/lib/api";

import { MyPageClient } from "./my-page-client";

export default async function MyPage() {
  let users: User[] = [];
  let entries: Entry[] = [];
  let error: string | null = null;

  try {
    [users, entries] = await Promise.all([fetchUsers(), fetchEntries()]);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "마이페이지 정보를 불러오지 못했습니다.";
  }

  if (error) {
    return (
      <PageShell className="page-shell--my">
        <InlineState
          tone="error"
          title="마이페이지를 준비하지 못했어요."
          description={error}
        />
      </PageShell>
    );
  }

  if (users.length === 0) {
    return (
      <PageShell className="page-shell--my">
        <InlineState
          title="프로필이 아직 없어요."
          description="먼저 사용자 데이터를 만든 뒤 마이페이지를 사용할 수 있습니다."
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="page-shell--my">
      <MyPageClient entries={entries} initialUser={users[0]} />
    </PageShell>
  );
}
