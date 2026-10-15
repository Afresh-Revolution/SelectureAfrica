export function CountryFlag({ country }: { country: "ng" | "gb" }) {
  if (country === "ng") {
    return (
      <svg className="flag" viewBox="0 0 6 3" aria-hidden="true">
        <rect width="6" height="3" fill="#fff" />
        <rect width="2" height="3" fill="#008751" />
        <rect x="4" width="2" height="3" fill="#008751" />
      </svg>
    );
  }

  return (
    <svg className="flag" viewBox="0 0 60 30" aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
