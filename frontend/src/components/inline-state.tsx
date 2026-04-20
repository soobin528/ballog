type InlineStateProps = {
  title: string;
  description: string;
  tone?: "default" | "error";
};

export function InlineState({
  title,
  description,
  tone = "default",
}: InlineStateProps) {
  return (
    <div className={`inline-state inline-state--${tone}`}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
