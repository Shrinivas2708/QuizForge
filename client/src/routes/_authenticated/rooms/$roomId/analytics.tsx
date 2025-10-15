import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Target,
  Clock,
} from "lucide-react";
import { ParticipantDetailsDialog } from "@/components/ParticipantDetailsDialog";

export const Route = createFileRoute("/_authenticated/rooms/$roomId/analytics")({
  component: RoomAnalyticsComponent,
});

type Submission = {
  id: string;
  finalScore: number | null;
  startedAt: string;
  completedAt: string | null;
  disqualified: boolean;
  durationSeconds: number | null;
  participant: {
    id: string;
    details: Record<string, string>;
    joinedAt: string;
  };
};

type Analytics = {
  room: {
    id: string;
    name: string;
    quiz: {
      title: string;
      id: string;
    };
    timeLimitSeconds: number;
    proctoringLevel: string;
  };
  averageScore: number;
  participants: Array<{ id: string; details: Record<string, string> }>;
  submissions: Submission[];
};



function RoomAnalyticsComponent() {
  const { roomId } = Route.useParams();

  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["roomAnalytics", roomId],
    queryFn: async () => {
      const response = await apiClient.get(`/rooms/${roomId}/analytics`);
      return response.data;
    },
  });

  const { data: detailedResults } = useQuery({
    queryKey: ["roomDetailedResults", roomId],
    queryFn: async () => {
      if (!analytics?.submissions) return [];
      
      const results = await Promise.all(
        analytics.submissions.map(async (submission) => {
          try {
            const response = await apiClient.get(
              `/submissions/${submission.id}/results`
            );
            console.log(response.data);
            
            return response.data;
          } catch {
            return null;
          }
        })
      );
      return results.filter(Boolean);
    },
    enabled: !!analytics?.submissions?.length,
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

  const completedSubmissions = analytics.submissions.filter(
    (s) => s.completedAt && !s.disqualified
  );
  const disqualifiedCount = analytics.submissions.filter(
    (s) => s.disqualified
  ).length;
  const averageCompletionTime = completedSubmissions.length
    ? completedSubmissions.reduce((acc, s) => {
        return acc + (s.durationSeconds || 0);
      }, 0) / completedSubmissions.length
    : 0;

  const scoreRanges = {
    "90-100%": 0,
    "80-89%": 0,
    "70-79%": 0,
    "60-69%": 0,
    "Below 60%": 0,
  };

  completedSubmissions.forEach((s) => {
    const score = s.finalScore || 0;
    if (score >= 90) scoreRanges["90-100%"]++;
    else if (score >= 80) scoreRanges["80-89%"]++;
    else if (score >= 70) scoreRanges["70-79%"]++;
    else if (score >= 60) scoreRanges["60-69%"]++;
    else scoreRanges["Below 60%"]++;
  });

  const questionStats = detailedResults?.[0]?.answers?.map((answer: any, idx: number) => {
    const questionId = answer.question.id;
    const questionText = answer.question.questionText;
    
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    detailedResults.forEach((result: any) => {
      const ans = result.answers[idx];
      if (ans.givenAnswer === null) {
        unattemptedCount++;
      } else if (ans.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalAttempts = correctCount + incorrectCount + unattemptedCount;
    const successRate = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    return {
      questionId,
      questionText,
      questionNumber: idx + 1,
      correctCount,
      incorrectCount,
      unattemptedCount,
      successRate,
      totalAttempts,
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-8 ">
      <div>
        <h1 className="text-3xl font-bold">{analytics.room.name}</h1>
        <p className="text-muted-foreground">
          Quiz: {analytics.room.quiz.title}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Participants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.participants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedSubmissions.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageScore}%</div>
            <Progress value={analytics.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Completion Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(averageCompletionTime / 60)}m{" "}
              {Math.floor(averageCompletionTime % 60)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Limit: {Math.floor(analytics.room.timeLimitSeconds / 60)} minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disqualified</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disqualifiedCount}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.room.proctoringLevel} proctoring
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>
                Performance breakdown across all participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(scoreRanges).map(([range, count]) => {
                const percentage = analytics.participants.length
                  ? (count / analytics.participants.length) * 100
                  : 0;
                return (
                  <div key={range} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{range}</span>
                      <span className="text-muted-foreground">
                        {count} participant{count !== 1 ? "s" : ""} (
                        {percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={percentage} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participant Results</CardTitle>
              <CardDescription>
                Individual performance for all participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.participant.details.name || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        {submission.participant.details.email || "N/A"}
                      </TableCell>
                      <TableCell>
                        {submission.disqualified ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className="font-semibold">
                            {submission.finalScore}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.durationSeconds
                          ? `${Math.floor(submission.durationSeconds / 60)}m ${submission.durationSeconds % 60}s`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {submission.disqualified ? (
                          <Badge variant="destructive">Disqualified</Badge>
                        ) : submission.completedAt ? (
                          <Badge variant="default">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.completedAt && (
                          <ParticipantDetailsDialog submission={submission} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Analysis</CardTitle>
              <CardDescription>
                Success rate and statistics for each question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionStats ? (
                questionStats.map((stat: any) => (
                  <div
                    key={stat.questionId}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          Q{stat.questionNumber}. {stat.questionText}
                        </p>
                      </div>
                      <Badge
                        variant={
                          stat.successRate >= 70
                            ? "default"
                            : stat.successRate >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {stat.successRate.toFixed(0)}% success rate
                      </Badge>
                    </div>

                    <Progress value={stat.successRate} />

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            {stat.correctCount} Correct
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((stat.correctCount / stat.totalAttempts) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="font-medium text-red-700 dark:text-red-400">
                            {stat.incorrectCount} Incorrect
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((stat.incorrectCount / stat.totalAttempts) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="font-medium text-yellow-700 dark:text-yellow-400">
                            {stat.unattemptedCount} Skipped
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((stat.unattemptedCount / stat.totalAttempts) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                  <span className="ml-2 text-muted-foreground">
                    Loading question analytics...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}     