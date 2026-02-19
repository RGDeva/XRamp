import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function TubelightNavBar({ items, className }: NavBarProps) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getActive = () => {
    // Find the most specific matching item
    const matched = items
      .filter((item) =>
        item.exact
          ? location.pathname === item.url
          : location.pathname.startsWith(item.url)
      )
      .sort((a, b) => b.url.length - a.url.length);
    return matched[0]?.name ?? items[0].name;
  };

  const activeTab = getActive();

  return (
    <div className={cn("flex items-center gap-1 bg-secondary/50 p-1 rounded-xl", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.name;

        return (
          <NavLink
            key={item.name}
            to={item.url}
            className={cn(
              "relative cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 select-none",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Tubelight glow pill */}
            {isActive && (
              <motion.div
                layoutId="tubelight"
                className="absolute inset-0 rounded-lg bg-card shadow-sm -z-10"
                initial={false}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              >
                {/* Tube light beam above */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-px bg-primary rounded-full">
                  <div className="absolute w-16 h-4 bg-primary/20 rounded-full blur-md -top-1 -left-3" />
                  <div className="absolute w-10 h-3 bg-primary/30 rounded-full blur-sm -top-0.5 -left-0" />
                  <div className="absolute w-5 h-2 bg-primary/40 rounded-full blur-sm top-0 left-2.5" />
                </div>
              </motion.div>
            )}

            {/* Desktop: text label */}
            <span className="hidden md:inline">{item.name}</span>

            {/* Mobile: icon only */}
            <span className="md:hidden">
              <Icon size={18} strokeWidth={2.5} />
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}
