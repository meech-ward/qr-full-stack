import { useState } from 'react'

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

import { QrCode, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Link } from '@tanstack/react-router'
import { cn } from './lib/utils'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    // Implement actual login logic here
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    // Implement actual logout logic here
    setIsLoggedIn(false)
    // router.push('/')
  }

  const NavItems = () => (
    <>
      <NavigationMenuItem>
        <NavigationMenuLink asChild={true} className={cn(navigationMenuTriggerStyle())}>
          <Link to="/">
            Create QR Code
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild={true}
          className={cn(navigationMenuTriggerStyle())}>
          <Link to="/my-codes">
            Saved Codes
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
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
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavItems />
                    </NavigationMenuList>
                  </NavigationMenu>
                </nav>
                {/* <div className="flex items-center border-l border-border ml-6 pl-6">
                  {isLoggedIn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/avatars/01.png" alt="@username" />
                            <AvatarFallback>UN</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">username</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              user@example.com
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button onClick={handleLogin} variant="ghost">Log in</Button>
                  )}
                </div> */}
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
                    <nav>
                      <NavigationMenu>
                        <NavigationMenuList className="flex flex-col space-y-4 mt-4 items-start">
                          <NavItems />
                        </NavigationMenuList>
                      </NavigationMenu>
                      {/* {!isLoggedIn && (
                        <Button onClick={handleLogin} className="w-full">Log in</Button>
                      )}
                      {isLoggedIn && (
                        <Button onClick={handleLogout} variant="outline" className="w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </Button>
                      )} */}
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