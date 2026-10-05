import type { SVGProps } from "react";

export type DashboardIconName =
  | "overview"
  | "calendar"
  | "users"
  | "ticket"
  | "services"
  | "profile"
  | "settings"
  | "logout"
  | "external"
  | "home";

type DashboardIconProps = SVGProps<SVGSVGElement> & {
  name: DashboardIconName;
  size?: number;
};

export function DashboardIcon({ name, size = 18, ...props }: DashboardIconProps) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} {...shared} {...props}>
      {name === "overview" ? <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </> : null}
      {name === "calendar" ? <>
        <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
        <path d="M7 3.5v4M17 3.5v4M3.5 10h17" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" strokeWidth="2.2" />
      </> : null}
      {name === "users" ? <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.5-3.1 2.3-5 5.5-5s5 1.9 5.5 5" />
        <path d="M15.5 5.5a3 3 0 0 1 0 5.8M16 15c2.5.4 4 2.1 4.5 5" />
      </> : null}
      {name === "ticket" ? <path d="M20 13a2.5 2.5 0 0 0 0-4.9V5.5A1.5 1.5 0 0 0 18.5 4h-13A1.5 1.5 0 0 0 4 5.5v2.6a2.5 2.5 0 0 0 0 4.9v2.6A1.5 1.5 0 0 0 5.5 17h13a1.5 1.5 0 0 0 1.5-1.5V13Z" /> : null}
      {name === "services" ? <>
        <path d="m14.5 6.5 3-3a4.2 4.2 0 0 1 .8 4.8l-7.7 7.8a2.2 2.2 0 0 1-3.1 0l-.6-.6a2.2 2.2 0 0 1 0-3.1l7.8-7.7a4.2 4.2 0 0 1 4.8.8" />
        <path d="m5 16-2 2 3 3 2-2M14 10l-2-2" />
      </> : null}
      {name === "profile" ? <>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 20c.7-3.5 3-5.5 7-5.5s6.3 2 7 5.5" />
      </> : null}
      {name === "settings" ? <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6.5v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </> : null}
      {name === "logout" ? <>
        <path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" />
        <path d="M11 12h9M16.5 8.5 20 12l-3.5 3.5" />
      </> : null}
      {name === "external" ? <>
        <path d="M14 5h5v5M19 5l-8 8" />
        <path d="M19 14.5v3A1.5 1.5 0 0 1 17.5 19h-12A1.5 1.5 0 0 1 4 17.5v-12A1.5 1.5 0 0 1 5.5 4h3" />
      </> : null}
      {name === "home" ? <>
        <path d="m4 10 8-6 8 6v9.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V10Z" />
        <path d="M9.5 20v-5h5v5" />
      </> : null}
    </svg>
  );
}
