import { SideNav, TabBar } from "@/components/tabs";

// Signed-in frame: a sidebar from tablet width up, four bottom tabs on phones.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:grid md:min-h-dvh md:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <SideNav />
      <div className="min-w-0">{children}</div>
      <TabBar />
    </div>
  );
}
