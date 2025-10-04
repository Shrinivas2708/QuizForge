import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ScrollArea } from './ui/scroll-area'
import { useChatHistory } from '@/hooks/useChatHistory'
import { Spinner } from './ui/spinner'
import { Fragment } from 'react'
import { Button } from './ui/button'

export function AppSidebar() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useChatHistory()

  const { location } = useRouterState()
  const navigate = useNavigate()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="">
            <div className=" mt-2 text-center">
              <Link to="/" className="">
                <p
                  className="font-logo   text-3xl font-extrabold cursor-pointer hover:text-foreground/80 "
                  onClick={()=>navigate({to:"/"})}
                >
                  <span className="group-data-[state=collapsed]:hidden">
                    Quizforge
                  </span>
                  <span className="hidden group-data-[state=collapsed]:block dark:text-white text-3xl">
                    Q
                  </span>
                </p>
              </Link>
            </div>
            <SidebarMenu className="mt-4 ">
              <ScrollArea className="h-[40rem] px-2">
                {status === 'pending' ? (
                  <div className="flex justify-center mt-4">
                    <Spinner />
                  </div>
                ) : status === 'error' ? (
                  <div className="text-center text-destructive mt-4">
                    Error: {error.message}
                  </div>
                ) : (
                  <>
                    {data.pages.map((group, i) => (
                      <Fragment key={i}>
                        {group.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={location.pathname.includes(chat.id)}
                            >
                              <Link to={`/chat/$chatId` } params={{chatId:chat.id}}>{chat.title}</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </Fragment>
                    ))}
                    <div className="flex justify-center mt-2">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={!hasNextPage || isFetchingNextPage}
                        variant="ghost"
                        size="sm"
                      >
                        {isFetchingNextPage
                          ? 'Loading more...'
                          : hasNextPage
                          ? 'Load More'
                          : 'Nothing more to load'}
                      </Button>
                    </div>
                  </>
                )}
              </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}