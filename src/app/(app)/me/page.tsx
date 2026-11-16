import { Me } from "./me";
export const metadata = { title: "Me" };
export default function Page() { return <Me testMode={process.env.BLOAT_TEST_LOGIN === "1"} />; }
