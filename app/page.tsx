import { redirect } from "next/navigation";

// The bare domain root isn't a real screen in this app — send visitors
// straight into it. proxy.ts then bounces to /login if they're not signed in.
export default function Home() {
  redirect("/dashboard");
}
