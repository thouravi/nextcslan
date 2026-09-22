import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Svg>
  )
}

export function IconPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  )
}

export function IconArena(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-5h6v5" />
      <path d="M4 20h16" />
    </Svg>
  )
}

export function IconPlane(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </Svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.2 19a4.2 4.2 0 0 1 5.8-3.6" />
    </Svg>
  )
}

export function IconClock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </Svg>
  )
}

export function IconTicket(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9a2.5 2.5 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2.5 2.5 0 0 0 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
      <path d="M13 6v1.5M13 16.5V18M13 11v2" />
    </Svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" />
    </Svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function Fact({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <span className="fact">
      <span className="fact-icon">{icon}</span>
      <span>{children}</span>
    </span>
  )
}
