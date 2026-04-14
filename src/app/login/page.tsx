import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginChrome from "@/app/login/ui/LoginChrome";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  return <LoginChrome />;
}

