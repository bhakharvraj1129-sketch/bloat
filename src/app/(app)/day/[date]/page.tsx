import { DayDetail } from "./day";
export const metadata = { title: "Day" };
export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <DayDetail date={date} />;
}
