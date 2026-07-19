const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="25" width="80" height="20" rx="4" fill="currentColor" opacity="0.8" />
    <rect x="15" y="18" width="70" height="10" rx="2" fill="currentColor" opacity="0.5" />
    <circle cx="28" cy="48" r="8" fill="currentColor" opacity="0.9" />
    <circle cx="72" cy="48" r="8" fill="currentColor" opacity="0.9" />
    <rect x="20" y="28" width="12" height="6" rx="1" fill="currentColor" opacity="0.3" />
    <rect x="60" y="28" width="12" height="6" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

export default CarIcon;