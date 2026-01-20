export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Purple rounded square background */}
    <rect width="32" height="32" rx="6" fill="#7C3AED"/>
    
    {/* White B letter */}
    <path 
      d="M10 8h7c1.5 0 2.7.4 3.6 1.2.9.8 1.4 1.9 1.4 3.2 0 1-.3 1.8-.8 2.5-.5.7-1.2 1.1-2 1.4v.1c1 .2 1.8.7 2.4 1.4.6.8.9 1.7.9 2.8 0 1.5-.5 2.7-1.5 3.5-1 .9-2.4 1.3-4.1 1.3H10V8zm3.5 7.2h3c.7 0 1.3-.2 1.7-.5.4-.4.6-.9.6-1.5 0-.6-.2-1.1-.6-1.4-.4-.3-.9-.5-1.6-.5h-3.1v3.9zm0 7.5h3.4c.8 0 1.4-.2 1.8-.6.5-.4.7-.9.7-1.6 0-.7-.2-1.2-.7-1.6-.4-.4-1-.6-1.8-.6h-3.4v4.4z" 
      fill="white"
    />
    
    {/* Lime beacon dot */}
    <circle cx="25" cy="7" r="4" fill="#84CC16"/>
    
    {/* Subtle glow ring */}
    <circle cx="25" cy="7" r="5.5" stroke="#84CC16" strokeOpacity="0.4" strokeWidth="1" fill="none"/>
  </svg>
)
