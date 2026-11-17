import { Me } from "./me";
export const dynamic = "force-dynamic"; // test-only buttons follow the running server's settings, not the build
export const metadata = { title: "Me" };
export default function Page() { return <Me testMode={process.env.BLOAT_TEST_LOGIN === "1"} />; }
