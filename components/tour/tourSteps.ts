import type { Step } from "react-joyride";
import type { Role } from "@/lib/types";

/**
 * Steps target elements by `data-tour="..."` attribute (see Sidebar.tsx,
 * Topbar.tsx, and each dashboard page for where these are placed). Steps
 * are filtered per role so a Cashier isn't shown "Suppliers" if they can't
 * see it, etc.
 *
 * NOTE: tour copy is currently English-only. To localize it, add a `tour`
 * section to lib/i18n/translations.ts (same pattern as the rest of the app)
 * and swap the hardcoded strings below for t('tour....') calls.
 */
export function getTourSteps(role: Role): Step[] {
  const common: Step[] = [
    {
      target: '[data-tour="sidebar-logo"]',
      content:
        "Welcome to Rahat Pharmacy! This quick tour shows you around — you can replay it anytime from the Help button.",
      placement: "right",
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar-nav"]',
      content: "Your navigation menu — only the sections relevant to your role are shown here.",
      placement: "right",
    },
  ];

  const roleSteps: Record<Role, Step[]> = {
    OWNER: [
      {
        target: '[data-tour="nav-overview"]',
        content: "Your home base — chain-wide sales, profit, stock value and alerts at a glance.",
        placement: "right",
      },
      {
        target: '[data-tour="branch-switcher"]',
        content: "Switch between 'All branches' (chain-wide) or a single branch to filter every number on the page.",
        placement: "bottom",
      },
      {
        target: '[data-tour="nav-pos"]',
        content: "Ring up a sale yourself here, same screen your cashiers use.",
        placement: "right",
      },
      {
        target: '[data-tour="nav-staff"]',
        content: "Add and manage staff accounts for every branch.",
        placement: "right",
      },
      {
        target: '[data-tour="nav-branches"]',
        content: "Open new pharmacy locations or manage existing ones — this is owner-only.",
        placement: "right",
      },
    ],
    MANAGER: [
      {
        target: '[data-tour="nav-overview"]',
        content: "Your branch's sales, profit, stock value and alerts at a glance.",
        placement: "right",
      },
      {
        target: '[data-tour="nav-pos"]',
        content: "Ring up a sale, same screen your cashiers use.",
        placement: "right",
      },
      {
        target: '[data-tour="nav-staff"]',
        content: "Add and manage staff for your branch.",
        placement: "right",
      },
    ],
    CASHIER: [
      {
        target: '[data-tour="nav-pos"]',
        content: "This is your main screen — search a medicine, add it to the cart, and check out.",
        placement: "right",
      },
      {
        target: '[data-tour="pos-search"]',
        content: "Search by name, generic name, SKU, or barcode. Tap a result to add it to the cart.",
        placement: "bottom",
      },
      {
        target: '[data-tour="pos-cart"]',
        content: "Your cart — adjust quantities, pick a payment method, then complete the sale.",
        placement: "left",
      },
      {
        target: '[data-tour="nav-invoices"]',
        content: "Look up any past sale here to reprint or download its receipt.",
        placement: "right",
      },
    ],
    ACCOUNTANT: [
      {
        target: '[data-tour="nav-finance"]',
        content: "Bank accounts, expenses and profit & loss — your main screen.",
        placement: "right",
      },
      {
        target: '[data-tour="nav-suppliers"]',
        content: "Track what the pharmacy owes each supplier here.",
        placement: "right",
      },
      {
        target: '[data-tour="branch-switcher"]',
        content: "View chain-wide finances or filter to a single branch.",
        placement: "bottom",
      },
    ],
    PHARMACIST: [
      {
        target: '[data-tour="nav-inventory"]',
        content: "Your main screen — medicines, batches, low-stock and expiry alerts.",
        placement: "right",
      },
      {
        target: '[data-tour="inventory-bulk-import"]',
        content: "Adding lots of medicines? Upload a CSV file here instead of one at a time.",
        placement: "bottom",
      },
    ],
  };

  const closing: Step[] = [
    {
      target: '[data-tour="help-button"]',
      content: "Forgot something? Click here anytime to see this tour again.",
      placement: "top",
    },
  ];

  return [...common, ...(roleSteps[role] || []), ...closing];
}
