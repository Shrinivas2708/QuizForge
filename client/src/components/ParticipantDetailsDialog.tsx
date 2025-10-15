import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";
import { useState } from "react";

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

export function ParticipantDetailsDialog({
  submission,
}: {
  submission: Submission;
}) {
  const [open, setOpen] = useState(false);

  const { data: detailedResults, isLoading } = useQuery({
    queryKey: ["submissionDetails", submission.id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/submissions/${submission.id}/results`,
      );
      console.log(response.data);

      return response.data;
    },
    enabled: open,
  });

  const { data: proctoringEvents } = useQuery({
    queryKey: ["proctoringEvents", submission.id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/submissions/${submission.id}/proctoring-events`,
      );
      return response.data;
    },
    enabled: open,
  });
  console.log(submission);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Eye className="mr-1 h-4 w-4" />
        Analysis
      </Button>
      <Dialog open={open} onOpenChange={setOpen} >
        <DialogContent className="max-h-[90vh]  max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detailed Analysis -{" "}
              {submission.participant.details.name || "Anonymous"}
            </DialogTitle>
            <DialogDescription>
              Complete submission details including timing, answers, and
              proctoring events
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Final Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {submission.finalScore}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {submission.durationSeconds
                        ? `${Math.floor(submission.durationSeconds / 60)}m ${submission.durationSeconds % 60}s`
                        : "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Started At
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {new Date(submission.startedAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completed At
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {submission.completedAt
                        ? new Date(submission.completedAt).toLocaleString()
                        : "Not completed"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Proctoring Events */}
              {proctoringEvents && proctoringEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Proctoring Events ({proctoringEvents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {proctoringEvents.map((event: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium capitalize">
                              {event.eventType.replace(/_/g, " ")}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {event.details && (
                            <Badge variant="outline">
                              {JSON.stringify(event.details)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Question-by-Question Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {detailedResults?.answers?.map(
                      (answer: any, idx: number) => (
                        <div
                          key={idx}
                          className="space-y-2 rounded-lg border p-4"
                        >
                          <div className="flex items-start justify-between">
                            <p className="font-medium">
                              Q{idx + 1}. {answer.question.questionText}
                            </p>
                            {answer.givenAnswer === null ? (
                              <Badge variant="secondary">Skipped</Badge>
                            ) : answer.isCorrect ? (
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Incorrect
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Given Answer:</span>{" "}
                              {answer.givenAnswer || "Not answered"}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">
                                Correct Answer:
                              </span>{" "}
                              {answer.question.data.correctAnswer}
                            </p>
                            {answer.question.feedback && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Feedback:</span>{" "}
                                {answer.question.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
