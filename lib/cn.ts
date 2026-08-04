/** Une clases condicionales de Tailwind. Sustituye a `clsx` sin dependencia. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
