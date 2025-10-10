import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ScrollArea } from "./ui/scroll-area";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Spinner } from "./ui/spinner";
import { Fragment } from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react"; // NEW: Import icons

export function AppSidebar() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useChatHistory();

  const { location } = useRouterState();
  const navigate = useNavigate();
  const {open} = useSidebar()
  // A small helper to get an icon based on the chat's source type
  // NOTE: You'll need to ensure your `useChatHistory` hook returns the `sourceType` for each chat.
 

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col">
        {/* HEADER SECTION */}
        <SidebarGroup>
          <SidebarGroupContent className="p-2">
            <Link to="/" className="block text-center">
              <p className="font-logo hover:text-foreground/80 cursor-pointer text-3xl font-extrabold">
                <span className="group-data-[state=collapsed]:hidden">Quizforge</span>
                <span className="hidden text-3xl group-data-[state=collapsed]:block">Q</span>
              </p>
            </Link>
            
            {/* IMPROVEMENT: Cleaner "New Chat" button */}
           <div className="mt-3 flex justify-center ">

              <Button onClick={()=> navigate({to:"/new"})} className="cursor-pointer">

                <Plus /> {open ? "New Chat" : ""}

              </Button>

            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CHAT HISTORY LIST - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-2">
            <SidebarMenu>
              {status === "pending" ? (
                <div className="mt-4 flex justify-center"> <Spinner /> </div>
              ) : status === "error" ? (
                <div className="text-destructive mt-4 text-center p-2"> Error: {error.message} </div>
              ) : (
                <>
                  {data.pages.map((group, i) => (
                    <Fragment key={i}>
                      {group.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={location.pathname.includes(chat.id)}
                            className="group-data-[state=collapsed]:hidden"
                          >
                            <Link
                              to={`/chat/$chatId`}
                              params={{ chatId: chat.id }}
                              className="flex items-center gap-3"
                            >
                              
                              {/* IMPROVEMENT: Truncate long titles */}
                              <span className="truncate group-data-[state=collapsed]:hidden">
                                {chat.title}
                              </span>
                            </Link>
                            
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </Fragment>
                  ))}
                </>
              )}
            </SidebarMenu>
          </ScrollArea>
        </div>

        {/* FOOTER SECTION - For the "Load More" button */}
        <div className="p-2 mt-auto">
          {hasNextPage && (
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {isFetchingNextPage ? "Loading..." : "Load More"}
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}