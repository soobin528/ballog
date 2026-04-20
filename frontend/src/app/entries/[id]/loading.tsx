import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";

export default function EntryLoading() {
  return (
    <PageShell>
      <InlineState
        title="결과를 불러오는 중..."
        description="생성된 티켓과 다이어리를 준비하고 있어요."
      />
    </PageShell>
  );
}
