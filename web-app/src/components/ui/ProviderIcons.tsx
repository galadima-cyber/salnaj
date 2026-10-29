import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

// ─── Telecom Provider Brand Icons ────────────────────────────

export function MtnLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#FFCC00" />
      <ellipse cx="24" cy="24" rx="20" ry="13" stroke="#111827" strokeWidth="2.5" fill="none" />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="13"
        fill="#111827"
        letterSpacing="0.05em"
      >
        MTN
      </text>
    </svg>
  )
}

export function AirtelLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#E11900" />
      <path
        d="M24 10C17.5 10 13 14.5 13 21C13 29.5 24 38 24 38C24 38 35 29.5 35 21C35 14.5 30.5 10 24 10Z"
        fill="white"
        opacity="0.9"
      />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="10"
        fill="#E11900"
      >
        airtel
      </text>
    </svg>
  )
}

export function GloLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#22C55E" />
      <circle cx="24" cy="24" r="16" fill="#15803D" />
      <circle cx="22" cy="22" r="10" stroke="white" strokeWidth="3" fill="none" />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="12"
        fill="white"
      >
        glo
      </text>
    </svg>
  )
}

export function NineMobileLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#064E3B" />
      <circle cx="16" cy="19" r="6" fill="#10B981" />
      <text
        x="28"
        y="30"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="16"
        fill="#A7F3D0"
      >
        9
      </text>
    </svg>
  )
}

// ─── Cable TV Provider Brand Icons ────────────────────────────

export function DstvLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#005B94" />
      <path d="M12 15H21C27 15 31 18.5 31 24C31 29.5 27 33 21 33H12V15Z" fill="white" />
      <path d="M16 19H20C23 19 26 21 26 24C26 27 23 29 20 29H16V19Z" fill="#005B94" />
      <text
        x="36"
        y="28"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="8"
        fill="#38BDF8"
      >
        tv
      </text>
    </svg>
  )
}

export function GotvLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#65A30D" />
      <circle cx="20" cy="24" r="10" stroke="white" strokeWidth="4" fill="none" />
      <text
        x="33"
        y="28"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="11"
        fill="white"
      >
        tv
      </text>
    </svg>
  )
}

export function StarTimesLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#EA580C" />
      <polygon points="24,10 27,19 36,19 29,25 32,34 24,28 16,34 19,25 12,19 21,19" fill="#FEF08A" />
      <text
        x="24"
        y="42"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="6"
        fill="white"
      >
        STARTIMES
      </text>
    </svg>
  )
}

export function ShowmaxLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#BE185D" />
      <path d="M14 16H20L28 32H22L14 16Z" fill="#F472B6" />
      <path d="M22 16H28L36 32H30L22 16Z" fill="white" />
    </svg>
  )
}

// ─── Education Boards ─────────────────────────────────────────

export function WaecLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#1E3A8A" />
      <polygon points="24,12 34,22 30,36 18,36 14,22" stroke="#FBBF24" strokeWidth="2.5" fill="#172554" />
      <text
        x="24"
        y="27"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="8"
        fill="#FBBF24"
        letterSpacing="0.05em"
      >
        WAEC
      </text>
    </svg>
  )
}

export function NecoLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#065F46" />
      <circle cx="24" cy="24" r="14" stroke="#A7F3D0" strokeWidth="2" fill="#047857" />
      <text
        x="24"
        y="27"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="9"
        fill="white"
        letterSpacing="0.05em"
      >
        NECO
      </text>
    </svg>
  )
}

export function JambLogo({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill="#047857" />
      <polygon points="24,12 36,24 24,36 12,24" fill="#FDE047" />
      <text
        x="24"
        y="27"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="8"
        fill="#065F46"
        letterSpacing="0.05em"
      >
        JAMB
      </text>
    </svg>
  )
}

// ─── Electricity DISCO Brand Icons ────────────────────────────

export function DiscoLogo({ disco = '', size = 36, className = '' }: IconProps & { disco?: string }) {
  const d = disco.toLowerCase()
  let bg = '#7C3AED'
  let label = 'DISCO'

  if (d.includes('ikeja') || d.includes('ikedc')) {
    bg = '#B91C1C'
    label = 'IKEDC'
  } else if (d.includes('eko') || d.includes('ekedc')) {
    bg = '#0284C7'
    label = 'EKEDC'
  } else if (d.includes('abuja') || d.includes('aedc')) {
    bg = '#1D4ED8'
    label = 'AEDC'
  } else if (d.includes('ibadan') || d.includes('ibedc')) {
    bg = '#047857'
    label = 'IBEDC'
  } else if (d.includes('enugu') || d.includes('eedc')) {
    bg = '#C2410C'
    label = 'EEDC'
  } else if (d.includes('kano') || d.includes('kedco')) {
    bg = '#4338CA'
    label = 'KEDCO'
  } else if (d.includes('portharcourt') || d.includes('phed')) {
    bg = '#0F766E'
    label = 'PHED'
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="14" fill={bg} />
      <path d="M26 10L16 25H24L22 38L32 23H24L26 10Z" fill="#FDE047" />
      <text
        x="24"
        y="44"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="6"
        fill="white"
      >
        {label}
      </text>
    </svg>
  )
}

// ─── Dynamic Network Badge Component ──────────────────────────

export function NetworkBadge({ network = '', size = 40, className = '' }: { network: string; size?: number; className?: string }) {
  const n = (network || '').toUpperCase()
  switch (n) {
    case 'MTN':
      return <MtnLogo size={size} className={className} />
    case 'AIRTEL':
      return <AirtelLogo size={size} className={className} />
    case 'GLO':
      return <GloLogo size={size} className={className} />
    case 'ETISALAT':
    case '9MOBILE':
      return <NineMobileLogo size={size} className={className} />
    default:
      return <MtnLogo size={size} className={className} />
  }
}
