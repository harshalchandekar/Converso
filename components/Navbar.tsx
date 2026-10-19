import Link from "next/link";
import { SignInButton, SignedOut, UserButton, SignedIn } from "@clerk/nextjs";
import NavItems from "./NavItems";
import Logo from "./Logo";
import UsageMeter from "./UsageMeter";

const NavBar = () => {
    return(
       <nav className="navbar">
        <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
                <Logo />
            </div>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
           <NavItems />
            <SignedOut>
                <SignInButton>
                    <button className="btn-signin">Sign In</button>
                </SignInButton>
            </SignedOut>
            <SignedIn>
                <UsageMeter />
                <UserButton />
            </SignedIn>
        </div>
       </nav>
    )
}

export default NavBar;