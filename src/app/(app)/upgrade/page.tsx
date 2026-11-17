import { Upgrade } from "./upgrade";
export const dynamic = "force-dynamic"; // test-only buttons follow the running server's settings, not the build
export const metadata = { title: "Bloat Pro" };
export default function Page() { return <Upgrade testMode={process.env.BLOAT_TEST_LOGIN === "1"} />; }
