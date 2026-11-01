import { scholarshipMetadata } from "../metadata"
import DonateClient from "./DonateClient"

export const generateMetadata = () => scholarshipMetadata("donate", "/scholarships/donate")

export default function DonatePage() {
  return <DonateClient />
}
