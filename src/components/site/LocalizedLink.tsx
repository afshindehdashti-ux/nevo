import { Link as TSLink, useParams, type LinkProps } from "@tanstack/react-router";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

/**
 * Locale-aware Link. Accepts the same `to` string as TanStack's Link but
 * automatically prefixes with the current `$lang` param so callers can keep
 * writing `to="/about"` instead of `to="/$lang/about" params={{ lang }}`.
 *
 * Absolute strings that already start with `/$lang` or with a supported
 * locale (`/en/...`) pass through untouched. External URLs (`http…`,
 * `mailto:`, `tel:`, `#…`) fall through to a plain <a>.
 */

type AnyLinkProps = Omit<LinkProps, "to" | "params"> &
  ComponentPropsWithoutRef<"a"> & {
    to?: string;
    params?: Record<string, string>;
    children?: ReactNode;
  };

function startsWithLocale(path: string) {
  const first = path.replace(/^\//, "").split("/")[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(first);
}

export const LocalizedLink = forwardRef<HTMLAnchorElement, AnyLinkProps>(
  function LocalizedLink({ to, params, ...rest }, ref) {
    const routeParams = useParams({ strict: false }) as { lang?: Locale };
    const lang = (routeParams?.lang ?? DEFAULT_LOCALE) as Locale;

    if (typeof to !== "string" || !to.startsWith("/")) {
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      return <a ref={ref} href={to as string | undefined} {...(rest as ComponentPropsWithoutRef<"a">)} />;
    }

    if (to.startsWith("/$lang") || startsWithLocale(to)) {
      return (
        <TSLink
          ref={ref}
          {...(rest as object)}
          to={to as never}
          params={{ ...(params ?? {}), lang } as never}
        />
      );
    }

    const suffix = to === "/" ? "/" : to;
    const nextTo = `/$lang${suffix}`;
    return (
      <TSLink
        ref={ref}
        {...(rest as object)}
        to={nextTo as never}
        params={{ ...(params ?? {}), lang } as never}
      />
    );
  }
);

export { LocalizedLink as Link };
