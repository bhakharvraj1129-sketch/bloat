import { Glide } from "@/components/glide";

// Each signed-in screen glides in. The tab bar and sidebar live in the layout, so they stay still.
export default function Template({ children }: { children: React.ReactNode }) {
  return <Glide>{children}</Glide>;
}
