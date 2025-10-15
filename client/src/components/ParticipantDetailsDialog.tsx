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
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Info,
  Clock,
  Calendar,
  Percent,
  Timer,
} from "lucide-react";
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

// NEW: A helper component for the summary stats for better readability
function StatCard({
  icon: Icon,
  title,
  value,
  valueClassName = "text-2xl",
}: {
  icon: React.ElementType;
  title: string;
  value: string | React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center space-x-4 rounded-lg border bg-card p-4 text-card-foreground">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={`font-bold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

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

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Eye className="mr-1 h-4 w-4" />
        Analysis
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* CHANGE: Increased max-width for the new layout */}
        <DialogContent className="max-h-[90vh] w-[90vw] max-w-[1280px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Detailed Analysis:{" "}
              <span className="font-bold text-primary">
                {submission.participant.details.name || "Anonymous"}
              </span>
            </DialogTitle>
            <DialogDescription>
              A complete breakdown of the submission, including timing, answers,
              and proctoring events.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            // CHANGE: Main layout is now a 3-column grid
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left Column for Stats */}
              <div className="col-span-1 flex flex-col gap-6">
                <h3 className="text-lg font-semibold">Summary</h3>
                <StatCard
                  icon={Percent}
                  title="Final Score"
                  value={`${submission.finalScore}%`}
                />
                <StatCard
                  icon={Timer}
                  title="Duration"
                  value={
                    submission.durationSeconds
                      ? `${Math.floor(submission.durationSeconds / 60)}m ${submission.durationSeconds % 60}s`
                      : "N/A"
                  }
                />
                <StatCard
                  icon={Calendar}
                  title="Started At"
                  value={new Date(submission.startedAt).toLocaleString()}
                  valueClassName="text-sm"
                />
                <StatCard
                  icon={Clock}
                  title="Completed At"
                  value={
                    submission.completedAt
                      ? new Date(submission.completedAt).toLocaleString()
                      : "Not completed"
                  }
                  valueClassName="text-sm"
                />

                {/* Proctoring Events */}
                {proctoringEvents && proctoringEvents.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Proctoring Events ({proctoringEvents.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {proctoringEvents.map((event: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-medium capitalize">
                                {event.eventType.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column for Question Breakdown */}
              <div className="col-span-1 lg:col-span-2">
                <h3 className="mb-6 text-lg font-semibold">
                  Question Breakdown
                </h3>
                <div className="space-y-4">
                  {detailedResults?.answers?.map((answer: any, idx: number) => {
                    const isCorrect = answer.isCorrect;
                    const borderColor = isCorrect
                      ? "border-green-500/50"
                      : "border-red-500/50";
                    const bgColor = isCorrect
                      ? "bg-green-500/10"
                      : "bg-red-500/10";

                    return (
                      <div
                        key={idx}
                        className={`space-y-3 rounded-lg border-l-4 p-4 ${borderColor} ${bgColor}`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="flex-1 font-medium text-card-foreground">
                            Q{idx + 1}. {answer.question.questionText}
                          </p>
                          {answer.givenAnswer === null ? (
                            <Badge variant="secondary">Skipped</Badge>
                          ) : isCorrect ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" /> Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" /> Incorrect
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-3 text-sm">
                          {/* Given Answer */}
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            ) : (
                              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                            )}
                            <div>
                              <span className="font-semibold">Your Answer:</span>{" "}
                              <span className="text-muted-foreground">
                                {answer.givenAnswer || "Not answered"}
                              </span>
                            </div>
                          </div>
                          
                          {/* Correct Answer (only shown if incorrect) */}
                          {!isCorrect && (
                            <div className="flex items-start gap-2">
                              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                               <div>
                                <span className="font-semibold">Correct Answer:</span>{" "}
                                <span className="text-muted-foreground">
                                  {answer.question.data.correctAnswer}
                                </span>
                               </div>
                            </div>
                          )}
                          
                          {/* Feedback */}
                          {answer.question.feedback && (
                            <div className="mt-2 flex items-start gap-3 rounded-md bg-background/50 p-3">
                              <Info className="h-4 w-4 flex-shrink-0 text-blue-500 mt-0.5" />
                              <div>
                                <span className="font-semibold">Feedback:</span>
                                <p className="text-muted-foreground">
                                 {answer.question.feedback}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}