import { Review } from "./review";
export const metadata = { title: "Review" };
export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <Review date={date} />;
}
