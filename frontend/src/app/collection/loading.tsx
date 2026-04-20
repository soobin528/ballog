import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";

export default function CollectionLoading() {
  return (
    <PageShell>
      <InlineState
        title="컬렉션을 불러오는 중..."
        description="최근 직관 티켓을 정리하고 있어요."
      />
    </PageShell>
  );
}
