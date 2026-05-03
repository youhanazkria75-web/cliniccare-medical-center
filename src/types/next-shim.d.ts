declare module "*.css";

declare module "next" {
  export interface Metadata {
    title?: string | { default?: string; template?: string };
    description?: string;
    icons?: {
      icon?: string;
      shortcut?: string;
      apple?: string;
    };
  }
}

declare module "next/link" {
  import * as React from "react";

  export interface LinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children?: React.ReactNode;
  }

  const Link: React.FC<LinkProps>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
  };

  export function usePathname(): string;
}