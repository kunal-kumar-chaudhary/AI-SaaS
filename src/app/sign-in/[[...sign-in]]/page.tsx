import { SignIn } from "@clerk/nextjs";

export default function Page() {
    console.log("inside sign-in page")
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <SignIn />
        </div>

    )
}