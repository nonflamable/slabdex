export default function ValueDisplay({ value, size = "md", label, showNA = true }) {
  const sizes = {
    sm: "text-lg font-bold",
    md: "text-2xl font-bold",
    lg: "text-4xl font-black",
    xl: "text-5xl font-black",
  };

  if (!value && showNA) {
    return (
      <div>
        {label && <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>}
        <span className="text-muted-foreground text-sm">No data</span>
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>}
      <span className={sizes[size]}>
        ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}