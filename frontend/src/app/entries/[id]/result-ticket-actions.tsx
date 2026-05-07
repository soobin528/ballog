"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { TicketCard } from "@/components/ticket-card";
import type { Entry, Game } from "@/lib/api";

type ResultTicketActionsProps = {
  entry: Entry;
  game: Game;
};

function inlineComputedStyles(source: Element, target: Element) {
  const computedStyle = window.getComputedStyle(source);
  const styleText = Array.from(computedStyle)
    .map((property) => `${property}:${computedStyle.getPropertyValue(property)};`)
    .join("");

  target.setAttribute("style", styleText);

  Array.from(source.children).forEach((child, index) => {
    const targetChild = target.children[index];
    if (targetChild) {
      inlineComputedStyles(child, targetChild);
    }
  });
}

async function downloadTicketImage(element: HTMLElement, entryId: number) {
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">
      <foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("티켓 이미지를 만들지 못했습니다."));
    });
    image.src = svgUrl;
    await loaded;

    const canvas = document.createElement("canvas");
    const scale = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 저장을 지원하지 않는 브라우저입니다.");
    }

    context.scale(scale, scale);
    context.drawImage(image, 0, 0, rect.width, rect.height);

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `balllog-ticket-${entryId}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function ResultTicketActions({ entry, game }: ResultTicketActionsProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = `${entry.watched_team} 직관 티켓`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: "Balllog에 남긴 직관 티켓이에요.",
          url: shareUrl,
        });
        setMessage("공유 창을 열었어요.");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setMessage("티켓 링크를 복사했어요.");
    } catch {
      setMessage("공유를 취소했어요.");
    }
  };

  const handleSave = async () => {
    if (!ticketRef.current) {
      setMessage("저장할 티켓을 찾지 못했어요.");
      return;
    }

    try {
      await downloadTicketImage(ticketRef.current, entry.id);
      setMessage("화면의 티켓 이미지를 저장했어요.");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "티켓 저장에 실패했어요.",
      );
    }
  };

  return (
    <>
      <article className="result-ticket-stage" aria-label="생성된 티켓">
        <div ref={ticketRef}>
          <TicketCard entry={entry} game={game} variant="large" />
        </div>
      </article>

      <div className="result-actions result-actions--stacked">
        <Link className="button button--primary button--wide" href="/collection">
          컬렉션에서 모든 티켓 보기
        </Link>
        <button className="button button--ghost" type="button" onClick={handleShare}>
          공유
        </button>
        <button className="button button--ghost" type="button" onClick={handleSave}>
          저장
        </button>
        <Link className="button button--ghost button--wide" href="/">
          홈으로 돌아가기
        </Link>
      </div>

      {message ? <p className="result-action-message">{message}</p> : null}
    </>
  );
}
