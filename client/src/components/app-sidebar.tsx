import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import { ScrollArea } from './ui/scroll-area'

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarGroupContent className="">
            <div className=" mt-2 text-center">
              <Link to="/" className="">
                <a
                  className="font-logo   text-3xl font-extrabold cursor-pointer hover:text-foreground/80 "
                  href="/"
                >
                  <span className="group-data-[state=collapsed]:hidden">
                    Quizforge
                  </span>
                  <span className="hidden group-data-[state=collapsed]:block dark:text-white text-3xl">
                    Q
                  </span>
                </a>
              </Link>
            </div>
            <SidebarMenu className='mt-4 '>
             <ScrollArea className='h-[40rem] text-center flex justify-center items-center'>
              No history
             </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
