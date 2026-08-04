import type { BrandContext } from "./design-system";

// Page-planner — determines which pages to generate for a user's site
// based on their business_type + primary_goal. Every site gets Home +
// About + Contact; middle pages vary. Naming (URL slug + nav label)
// adapts to the domain.
//
// Per DESIGN.md multi-page composition rules:
//   personal_brand (sells)             -> Home + About + WorkWithMe + Contact
//   personal_brand (builds audience)   -> Home + About + Newsletter + Contact
//   service (any professional service) -> Home + About + Services + Contact
//   saas                               -> Home + About + Features + Contact
//   agency                             -> Home + About + Work + Contact
//   ecommerce                          -> Home + About + Contact
//   other                              -> Home + About + Contact

export type PageType = "home" | "about" | "services" | "contact" | "lead-magnet";

export type PagePlan = {
  path: string;         // "/", "/about", etc.
  title: string;        // page <title> value
  pageType: PageType;   // which page-type MD spec to load
  navLabel: string;     // label shown in the shared nav
};

export function planPages(brand: BrandContext): PagePlan[] {
  const bt = brand.businessType;
  const pg = brand.primaryGoal;

  const brandTitle = brand.brandName ?? "Home";

  const pages: PagePlan[] = [
    { path: "/", title: brandTitle, pageType: "home", navLabel: "Home" },
    { path: "/about", title: "About", pageType: "about", navLabel: "About" },
  ];

  // Middle page — Services, Lead-Magnet, or none.
  const middle = middlePageFor(bt, pg);
  if (middle) pages.push(middle);

  pages.push({
    path: "/contact",
    title: "Contact",
    pageType: "contact",
    navLabel: "Contact",
  });

  return pages;
}

function middlePageFor(
  businessType: string | null,
  primaryGoal: string | null,
): PagePlan | null {
  // ecommerce + other + unknown -> no middle page for launch scope
  if (!businessType || businessType === "ecommerce" || businessType === "other") {
    return null;
  }

  // personal_brand -> either Newsletter (lead capture) or WorkWithMe (services)
  if (businessType === "personal_brand") {
    if (primaryGoal === "build_audience" || primaryGoal === "capture_leads") {
      return {
        path: "/newsletter",
        title: "Newsletter",
        pageType: "lead-magnet",
        navLabel: "Newsletter",
      };
    }
    return {
      path: "/work-with-me",
      title: "Work with me",
      pageType: "services",
      navLabel: "Work with me",
    };
  }

  // saas -> Features (services page with pricing tiers inside)
  if (businessType === "saas") {
    return {
      path: "/features",
      title: "Features",
      pageType: "services",
      navLabel: "Features",
    };
  }

  // agency -> Work
  if (businessType === "agency") {
    return {
      path: "/work",
      title: "Work",
      pageType: "services",
      navLabel: "Work",
    };
  }

  // service (law, medical, consulting, etc.) -> Services
  return {
    path: "/services",
    title: "Services",
    pageType: "services",
    navLabel: "Services",
  };
}
