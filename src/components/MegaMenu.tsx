import * as Menu from "@radix-ui/react-dropdown-menu";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
const stones = [
  ["tiger-eye", "Tiger Eye"],
  ["pyrite", "Pyrite"],
  ["amethyst", "Amethyst"],
  ["hematite", "Hematite"],
  ["green-quartz", "Green Quartz"],
  ["lava", "Lava"],
  ["dhan-yog", "Dhan Yog"],
] as const;
export function MegaMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className="header-link pashan-shop-trigger">
        Shop <ChevronDown size={15} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className="pashan-shop-menu"
          sideOffset={12}
          align="start"
          collisionPadding={20}
        >
          <Menu.Item asChild>
            <Link to="/collections">All bracelets</Link>
          </Menu.Item>
          <Menu.Item asChild>
            <Link to="/rashi">Rashi collection · ₹899</Link>
          </Menu.Item>
          <Menu.Item asChild>
            <Link to="/products/$slug" params={{ slug: "make-your-own" }}>
              Make your own
            </Link>
          </Menu.Item>
          <Menu.Separator className="pashan-menu-divider" />
          <Menu.Label className="pashan-menu-label">
            Explore by stone
          </Menu.Label>
          {stones.map(([slug, label]) => (
            <Menu.Item asChild key={slug}>
              <Link to="/products/$slug" params={{ slug }}>
                {label}
              </Link>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
