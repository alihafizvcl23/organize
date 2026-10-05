"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-forest text-white hover:bg-[#245a48]",
        secondary: "border border-line bg-white text-ink hover:bg-paper",
        ghost: "text-muted hover:bg-paper hover:text-ink",
        danger: "bg-red-50 text-red-700 hover:bg-red-100",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-[#9aa39e] focus:border-[#7da990] focus:ring-2 focus:ring-[#dcebe2]", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("min-h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#7da990]", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-[#7da990]", className)} {...props} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-line bg-white shadow-card", className)}>{children}</section>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-paper text-xl text-muted">—</div>
    <h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted">{description}</p>{action && <div className="mt-4">{action}</div>}
  </div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#648170]">{eyebrow}</p><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted">{description}</p></div>{action}
  </div>;
}

export function StatusBadge({ value, labels }: { value: string; labels: Record<string, string> }) {
  const styles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700", preparing: "bg-amber-50 text-amber-800", ready: "bg-emerald-50 text-emerald-800",
    delivered: "bg-[#edf3ef] text-[#466456]", cancelled: "bg-red-50 text-red-700", confirmed: "bg-emerald-50 text-emerald-800",
    completed: "bg-[#edf3ef] text-[#466456]",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles[value] ?? "bg-gray-100 text-gray-700")}>{labels[value] ?? value}</span>;
}
