import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import apiClient from "@/lib/axios";
import { ROOMS_URL } from "@/lib/exports";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {  Link as LinkIcon, Trash } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rooms/")({
  component: RouteComponent,
});
interface RoomType {
  id: string;
  name: string;
  shareableCode: string;
  createdAt: Date;
  quizTitle: string;
  timeLimit: number;
}
function RouteComponent() {
  const client  = useQueryClient()
  const { data: Rooms, isLoading } = useQuery<RoomType[]>({
    queryKey: ["roomHistory"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/rooms/getAllRooms`);

        return response.data;
      } catch (error) {
        return null;
      }
    },
  });
  const checkExpired = (
    timeLimitInSeconds: number,
    createdAt: Date | string,
  ) => {
    const createdDate = new Date(createdAt);
    const expiryTime = createdDate.getTime() + timeLimitInSeconds * 1000;
    const now = Date.now();
    return now > expiryTime; // true → expired, false → active
  };
  const { isPending , mutate } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete("/rooms/delete",{
        data:{
          roomId : id
        }
      })
    },
    onSuccess : ()=>{
      client.invalidateQueries({ queryKey: ['roomHistory'] })
      toast.success("Room deleted successfully.")
    },
    onError : () => {
      toast.error("Error while deleteing the room.")
    }
  })
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
                    <CardTitle className="text-3xl"> Rooms </CardTitle> 
         
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Spinner />
          ) : (
            Rooms?.length == 0 ? <div className="text-center text-foreground">
              No rooms
            </div> : 
            Rooms?.map((v) => {
              const isExpired = checkExpired(v.timeLimit, v.createdAt);
              return (
                <Card key={v.id}>
                  <CardHeader className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{v.name}</CardTitle>
                      <LinkIcon
                        onClick={() => {
                          window.open(
                            `${ROOMS_URL}/${v.shareableCode}`,
                            "_blank",
                          );
                        }}
                        size={15}
                        className="hover:text-primary cursor-pointer"
                      >
                        Go
                      </LinkIcon>
                    </div>
                    <Badge
                      variant={"outline"}
                      className={`${isExpired ? `border-red-400/50 text-red-500/80` : `border-green-400/80 text-green-400/80`}`}
                    >
                      {isExpired ? "Expired" : "Active"}
                    </Badge>
                  </CardHeader>
                  <CardContent >
                    <p >Quiz Title : {v.quizTitle}</p>
                    {/* Things to implement no of people gave the test */}
                    
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button size={"sm"} variant={"outline"}>
                      <Link
                        to="/rooms/$roomId/analytics"
                        params={{ roomId: v.id }}
                      >
                        Get Analytics
                      </Link>
                      
                    </Button>
                    <Button variant={"destructive"} onClick={ () => mutate(v.id)}>
                      {isPending ? <Spinner /> : <Trash/>}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
