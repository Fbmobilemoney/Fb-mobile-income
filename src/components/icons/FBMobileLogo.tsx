export function FBMobileLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 240 240" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="240" height="240" fill="transparent"/>
      
      {/* FB Mobile Logo Frame - Original Style */}
      {/* Top-left corner (Orange) - L-shaped */}
      <path d="M 45 27 L 135 27 L 135 45 L 63 45 L 63 117 L 45 117 Z" fill="#e65100" rx="4"/>
      
      {/* Top-right corner (Green) - L-shaped */}
      <path d="M 159 27 L 213 27 L 213 117 L 195 117 L 195 45 L 159 45 Z" fill="#7cb342" rx="4"/>
      
      {/* Bottom-left corner (Teal) - L-shaped */}
      <path d="M 45 141 L 63 141 L 63 213 L 135 213 L 135 231 L 45 231 Z" fill="#26a69a" rx="4"/>
      
      {/* Bottom-right corner (Blue) - L-shaped */}
      <path d="M 159 213 L 159 231 L 213 231 L 213 141 L 195 141 L 195 213 Z" fill="#42a5f5" rx="4"/>
      
      {/* Center F (Orange/Yellow) */}
      <g fill="#ffa726">
        <path d="M 84 69 L 120 69 L 120 81 L 96 81 L 96 90 L 114 90 L 114 102 L 96 102 L 96 129 L 84 129 Z"/>
      </g>
      
      {/* Center B (Orange/Yellow) */}
      <g fill="#ffa726">
        <path d="M 135 153 L 165 153 C 174 153 180 159 180 168 C 180 174 177 178 172 180 C 178 182 182 187 182 194 C 182 203 176 209 167 209 L 135 209 Z M 147 165 L 147 177 L 162 177 C 165 177 167 175 167 171 C 167 167 165 165 162 165 Z M 147 189 L 147 197 L 164 197 C 167 197 169 195 169 193 C 169 191 167 189 164 189 Z"/>
      </g>
    </svg>
  )
}
