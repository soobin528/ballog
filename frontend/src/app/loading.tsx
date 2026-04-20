import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";

export default function Loading() {
  return (
    <PageShell>
      <InlineState
        title="Ballog를 준비하는 중..."
        description="야구장 분위기를 화면에 불러오고 있어요."
      />
    </PageShell>
  );
}
