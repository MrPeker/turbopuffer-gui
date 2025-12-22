"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-mono"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--tp-surface))] group-[.toaster]:text-[hsl(var(--tp-text))] group-[.toaster]:border group-[.toaster]:border-[hsl(var(--tp-border-strong))] group-[.toaster]:shadow-lg group-[.toaster]:rounded-none",
          title: "group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:uppercase group-[.toast]:tracking-wider",
          description: "group-[.toast]:text-[hsl(var(--tp-text-muted))] group-[.toast]:text-[11px] group-[.toast]:font-mono",
          actionButton:
            "group-[.toast]:bg-[hsl(var(--tp-accent))] group-[.toast]:text-white group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-none group-[.toast]:h-7 group-[.toast]:px-2.5 group-[.toast]:border group-[.toast]:border-[hsl(var(--tp-accent))] hover:group-[.toast]:bg-[hsl(var(--tp-accent))]/90",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-[hsl(var(--tp-text-muted))] group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-none group-[.toast]:h-7 group-[.toast]:px-2.5 group-[.toast]:border group-[.toast]:border-[hsl(var(--tp-border-strong))] hover:group-[.toast]:bg-[hsl(var(--tp-surface-alt))]",
          success: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-[hsl(var(--tp-success))]",
          error: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-[hsl(var(--tp-danger))]",
          warning: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-[hsl(var(--tp-warning))]",
          info: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-[hsl(var(--tp-accent))]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
