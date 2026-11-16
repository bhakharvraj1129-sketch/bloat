import { Upgrade } from "./upgrade";
export const metadata = { title: "Bloat Pro" };
export default function Page() { return <Upgrade testMode={process.env.BLOAT_TEST_LOGIN === "1"} />; }
