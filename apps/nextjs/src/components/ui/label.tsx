import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : LabelPrimitive.Root;
  return (
    <Comp ref={ref} className={cn(labelVariants(), className)} {...props} />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
