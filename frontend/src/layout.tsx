
import { Button } from "@/components/ui/button"

import { QrCode, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Link } from '@tanstack/react-router'

const linkStyle = "rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&.active]:bg-accent"

export default function Layout({ children }: { children: React.ReactNode }) {

  const NavItems = () => (
    <>
      {/* <NavigationMenuItem>
        <NavigationMenuLink asChild={true} className={cn(navigationMenuTriggerStyle())}> */}
      <Button asChild={true} className={linkStyle}>
        <Link to="/">
          Create QR Code
        </Link>
      </Button>
      {/* </NavigationMenuLink> */}
      {/* </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild={true}
          className={cn(navigationMenuTriggerStyle())}> */}
      <Button asChild={true} className={linkStyle}>
        <Link to="/my-codes">
          Saved Codes
        </Link>
      </Button>
      {/* </NavigationMenuLink>
      </NavigationMenuItem> */}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto">
          <div className="py-4">
            <div className="relative flex items-center">
              <Link to="/" className="flex-none overflow-hidden md:w-auto">
                <span className="sr-only">QR Code App home page</span>
                <div className="flex items-center">
                  <QrCode className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-bold text-foreground hidden sm:inline-block">QR Code App</span>
                </div>
              </Link>
              <div className="relative hidden md:flex items-center ml-auto">
                <nav className="text-sm font-medium">

                  <NavItems />

                </nav>

              </div>
              <div className="ml-auto flex items-center md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <nav className="flex flex-col space-y-4 mt-4 items-start items-stretch">

                      <NavItems />

                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container max-w-7xl mx-auto py-6">
        {children}
      </main>
    </div>
  )
}