import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rooms/$roomId/analytics")({
  component: RoomAnalyticsComponent,
});

function RoomAnalyticsComponent() {
  const { roomId } = Route.useParams();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["roomAnalytics", roomId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/rooms/${roomId}/analytics`);
        return response.data;
      } catch (error) {
        return null;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">
          Could not load analytics for this room.
        </h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            Room Analytics: {analytics.room.name}
          </CardTitle>
          <CardDescription>
            Quiz: {analytics.room.quiz.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics.averageScore}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {analytics.participants.length}
                </p>
              </CardContent>
            </Card>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-semibold">Submissions</h3>
            <div className="space-y-3">
              {analytics.submissions.map((submission: any) => (
                <Card key={submission.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <p className="font-semibold">
                      {submission.participant.details.name || "Anonymous"}
                    </p>
                    {submission.disqualified ? (
                      <Badge variant="destructive">Disqualified</Badge>
                    ) : (
                      <Badge>{submission.finalScore}%</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Completed on:{" "}
                      {new Date(submission.completedAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}