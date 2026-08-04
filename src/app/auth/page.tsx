import { redirect } from "next/navigation"

interface AuthPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function AuthRootPage({ searchParams }: AuthPageProps) {
  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v))
    }
  })

  const queryString = params.toString()
  const isSignup =
    searchParams.mode === "signup" ||
    searchParams.step === "name" ||
    searchParams.step === "name-phone"

  const targetPath = isSignup ? "/auth/signup" : "/auth/signin"

  redirect(queryString ? `${targetPath}?${queryString}` : targetPath)
}
