import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import { useState } from "react";
import { RoomQuizTaker } from "@/components/RoomQuizTaker";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ThemeButton } from '@/components/toggle-theme'
export const Route = createFileRoute("/$shareableCode")({
  component: JoinRoomComponent,
});

interface RoomDetails {
  id: string;
  quizId: string;
  title: string;
  participantInfoRequired: string[];
}

interface JoinedState {
  participantId: string;
  quizId: string;
}

function JoinRoomComponent() {
  const { shareableCode } = Route.useParams();
  const [joinedState, setJoinedState] = useState<JoinedState | null>(null);
  const [formDetails, setFormDetails] = useState<Record<string, string>>({});

  const { data: roomDetails, isLoading: isLoadingRoom } = useQuery<RoomDetails>({
    queryKey: ["roomDetails", shareableCode],
    queryFn: async () => {
      const res = await apiClient.get(`/rooms/${shareableCode}`);
      return res.data;
    },
    enabled: !joinedState,
  });

  const joinMutation = useMutation({
    mutationFn: async (details: Record<string, string>) => {
      const res = await apiClient.post(`/rooms/${shareableCode}/join`, {
        details,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Successfully joined the room!");
      setJoinedState({
        participantId: data.participantId,
        quizId: data.quizId,
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to join room.");
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate(formDetails);
  };

  if (joinedState) {
    return (
      <RoomQuizTaker
        participantId={joinedState.participantId}
        shareableCode={shareableCode}
        quizId={joinedState.quizId}
      />
    );
  }

  if (isLoadingRoom) {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!roomDetails) {
    return (
      <div className="p-8 text-center">
        <h2>Room not found or has been closed.</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 grid place-items-center p-4 min-h-screen">
      <ThemeButton  />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{roomDetails.title}</CardTitle>
          <CardDescription>
            Enter your details to join the quiz.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 mb-3">
            {roomDetails.participantInfoRequired.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Label>
                <Input
                  id={field}
                  required
                  value={formDetails[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? <Spinner /> : "Join Quiz"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}