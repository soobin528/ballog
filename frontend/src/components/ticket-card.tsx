import Link from "next/link";

import type { Entry } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getAssetUrl } from "@/lib/api";

type TicketCardProps = {
  entry: Entry;
  href?: string;
};

export function TicketCard({ entry, href }: TicketCardProps) {
  const content = (
    <article className="ticket-card">
      <div className="ticket-card__image-wrap">
        {entry.ticket_image_url ? (
          <img
            className="ticket-card__image"
            src={getAssetUrl(entry.ticket_image_url) ?? ""}
            alt={`${entry.watched_team} 직관 티켓`}
          />
        ) : (
          <div className="ticket-card__placeholder">TICKET PREVIEW</div>
        )}
      </div>
      <div className="ticket-card__meta">
        <span className="ticket-card__team">{entry.watched_team}</span>
        <span className="ticket-card__date">{formatDate(entry.created_at)}</span>
      </div>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="ticket-card__link" href={href}>
      {content}
    </Link>
  );
}
