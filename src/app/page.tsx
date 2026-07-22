import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect homepage to URL Scan page
  redirect("/url-scan");
}
