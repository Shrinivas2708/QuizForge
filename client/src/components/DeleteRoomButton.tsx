import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import apiClient from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { toast } from "sonner";

export function DeleteRoomButton({ roomId }: { roomId: string }) {
  const client = useQueryClient();

  const { isPending, mutate } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete("/rooms/delete", {
        data: {
          roomId: id,
        },
      });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["roomHistory"] });
      toast.success("Room deleted successfully.");
    },
    onError: () => {
      toast.error("Error while deleting the room.");
    },
  });

  return (
    <Button variant={"destructive"} onClick={() => mutate(roomId)} disabled={isPending}>
      {isPending ? <Spinner /> : <Trash />}
    </Button>
  );
}