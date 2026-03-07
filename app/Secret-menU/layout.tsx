import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Ultimate Disney Cruise Planner",
  description:
    "Your all-in-one Disney cruise companion. Discover staterooms, plan your pixie dust and uncover secret hacks intelligently.",
  openGraph: {
    title: "The Ultimate Disney Cruise Planner",
    description:
      "Your all-in-one Disney cruise companion. Discover staterooms, plan your pixie dust and uncover secret hacks intelligently.",
    url: "https://www.disneytrivia.club/Secret-menU",
    images: [
      {
        url: "/og-secret-menu.png",
        width: 1536,
        height: 1024,
        alt: "The Ultimate Disney Cruise Planner — magical compass and treasure map with a cruise ship",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Ultimate Disney Cruise Planner",
    description:
      "Your all-in-one Disney cruise companion. Discover staterooms, plan your pixie dust and uncover secret hacks intelligently.",
    images: ["/og-secret-menu.png"],
  },
};

export default function SecretMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
