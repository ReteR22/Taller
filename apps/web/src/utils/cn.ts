/**
 * Utility para combinar clases de Tailwind CSS.
 * Alternativa ligera a clsx + tailwind-merge.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
