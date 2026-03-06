const LOGOS = {
  PSA: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a8b89d8b7fd36b5d0ec08f/144282e83_psa.png",
};

const logoSizes = {
  sm: "h-4",
  md: "h-5",
  lg: "h-6",
};

export default function GradeBadge({ company, grade, size = "md" }) {
  const badgeClass = {
    PSA: "grade-badge-psa",
    BGS: "grade-badge-bgs",
    CGC: "grade-badge-cgc",
  }[company] || "grade-badge-other";

  const sizes = {
   sm: "text-xs px-2 py-0.5 gap-1",
   md: "text-sm px-2.5 py-1 gap-1.5",
   lg: "text-base px-3 py-1.5 gap-2",
  };

  const logo = LOGOS[company];

  return (
   <span className={`inline-flex items-center rounded-full font-bold tracking-tight ${sizes[size]}`}>
      {logo ? (
        <img src={logo} alt={company} className={`${logoSizes[size]} w-auto object-contain`} />
      ) : (
        <span className="opacity-70 font-medium">{company}</span>
      )}
      <span className="font-black">{grade}</span>
    </span>
  );
}