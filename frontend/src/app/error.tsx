"use client";

import { useEffect } from "react";

import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="error-actions">
        <InlineState
          tone="error"
          title="예상치 못한 오류가 발생했어요."
          description={error.message || "잠시 후 다시 시도해주세요."}
        />
        <button className="button button--primary" onClick={reset} type="button">
          다시 시도
        </button>
      </div>
    </PageShell>
  );
}
