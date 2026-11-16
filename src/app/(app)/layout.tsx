import { TabBar } from "@/components/tabs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
