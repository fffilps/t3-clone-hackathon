import type * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import * as ToggleGroupPrimitiveValue from "@radix-ui/react-toggle-group";
import { cva } from "class-variance-authority";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitiveValue.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitiveValue.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitiveValue.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitiveValue.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitiveValue.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitiveValue.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitiveValue.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitiveValue.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant ?? variant,
          size: context.size ?? size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitiveValue.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitiveValue.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
