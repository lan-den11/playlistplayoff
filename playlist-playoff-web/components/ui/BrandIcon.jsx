export default function BrandIcon({ className, size, color = 'currentColor', strokeWidth = 2.5, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M4.5 7h4v10h-4M8.5 12h4" />
      <path d="M12.5 8.3 19.7 12 12.5 15.7Z" fill={color} strokeWidth="1.5" />
    </svg>
  );
}
