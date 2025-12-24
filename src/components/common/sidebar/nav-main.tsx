"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({ items }: { items: NavSection[] }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      {items.map((section, index) => (
        <SidebarGroup
          key={section.title}
          className="pb-0 space-y-1"
        >
          {index !== 0 && (
            <div className="h-px bg-primary-900" />
          )}

          <SidebarGroupLabel
            className={cn(
              "p-0 text-xs uppercase tracking-wider text-primary-200",
              index !== 0 && "mt-3"
            )}
          >
            {section.title}
          </SidebarGroupLabel>


          <SidebarMenu className="pb-0 space-y-1">
            {section.links.map((link) => {
              const isActive = pathname === link.href;

              const linkElement = (
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-4 p-2 rounded-md transition-colors text-sm font-medium",
                    isCollapsed && "justify-center",
                    isActive
                      ? "button-gradient border border-white/20 shadow-md shadow-primary-900/30"
                      : "text-primary-100 hover:bg-white/10 hover:text-primary-300"
                  )}
                >
                  <div className="relative w-5 h-5 shrink-0">
                    <Image
                      src={link.icon}
                      alt={link.label}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {!isCollapsed && <span>{link.label}</span>}
                </Link>
              );

              return (
                <SidebarMenuItem key={link.href}>
                  {isCollapsed ? (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        {linkElement}
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="font-medium border border-white/10"
                      >
                        {link.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkElement
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
