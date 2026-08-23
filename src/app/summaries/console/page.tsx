import { redirect } from 'next/navigation'

export default function SummaryConsoleRedirect() {
  redirect('/summaries/contributor')
}
