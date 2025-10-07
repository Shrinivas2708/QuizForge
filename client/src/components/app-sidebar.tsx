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
import { Plus } from "lucide-react";

export function AppSidebar() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useChatHistory();

  const { open } = useSidebar();
  const { location } = useRouterState();
  const navigate = useNavigate();
  const handleNewChat = ()=>{
    navigate({to:"/new"})
  }
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="">
            <div className="mt-2 text-center">
              <Link to="/" className="">
                <p
                  className="font-logo hover:text-foreground/80 cursor-pointer text-3xl font-extrabold"
                  onClick={() => navigate({ to: "/" })}
                >
                  <span className="group-data-[state=collapsed]:hidden">
                    Quizforge
                  </span>
                  <span className="hidden text-3xl group-data-[state=collapsed]:block dark:text-white">
                    Q
                  </span>
                </p>
              </Link>
            </div>
            <div className="mt-3 flex justify-center ">
              <Button onClick={handleNewChat} className="cursor-pointer">
                <Plus /> {open ? "New Chat" : ""}
              </Button>
            </div>
            <SidebarMenu className="mt-4">
              <ScrollArea className="h-[40rem] px-2">
                {status === "pending" ? (
                  <div className="mt-4 flex justify-center">
                    <Spinner />
                  </div>
                ) : status === "error" ? (
                  <div className="text-destructive mt-4 text-center">
                    Error: {error.message}
                  </div>
                ) : (
                  open ? <>
                    {data.pages.map((group, i) => (
                      <Fragment key={i}>
                        {group.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={location.pathname.includes(chat.id)}
                            >
                              <Link
                                to={`/chat/$chatId`}
                                params={{ chatId: chat.id }}
                              >
                                {chat.title}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </Fragment>
                    ))}
                    <div className="mt-2 flex justify-center">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={!hasNextPage || isFetchingNextPage}
                        variant="ghost"
                        size="sm"
                      >
                        {isFetchingNextPage
                          ? "Loading more..."
                          : hasNextPage
                            ? "Load More"
                            : "Nothing more to load"}
                      </Button>
                    </div>
                  </> : ""
                )}
              </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
