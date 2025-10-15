// client/src/components/CreateRoomDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { useNavigate } from "@tanstack/react-router";
import { ROOMS_URL } from "@/lib/exports";

interface CreateRoomDialogProps {
  quizId: string;
  children: React.ReactNode;
}

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  timeLimitSeconds: z.number().int().positive().optional(),
  proctoringLevel: z.enum(["none", "basic", "strict"]).default("basic"),
  participantFields: z.array(z.string()).min(1),
});

export function CreateRoomDialog({ quizId, children }: CreateRoomDialogProps) {
  const navigate = useNavigate()
  const createRoomMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createRoomSchema>) => {
      const response = await apiClient.post("/rooms", { ...values, quizId });
      return response.data;
    },
    onSuccess: async (data) => {
   
      
      try {
        
      await navigator.clipboard.writeText(`${ROOMS_URL}/${data.shareableCode}`)
      toast.success("Room created successfully and link copied to clipboard !");
      } catch (error) {
           toast.success("Room created successfully!");
           toast.error("Failed to copy to clipboard")
      }
      setInterval(()=>{
        navigate({to:"/rooms"})
      },2000)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create room.");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      proctoringLevel: "basic" as "none" | "basic" | "strict",
      timeLimitSeconds: 30,
      includeName: true,
      includeEmail: false,
    },
    onSubmit: ({ value }) => {
      const participantFields = [
        ...(value.includeName ? ["name"] : []),
        ...(value.includeEmail ? ["email"] : []),
      ];
      createRoomMutation.mutate({
        ...value,
        participantFields,
        timeLimitSeconds: value.timeLimitSeconds * 60,
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Room</DialogTitle>
          <DialogDescription>
            Configure the settings for your new room.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            validators={{
              onChange: createRoomSchema.shape.name,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Room Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors?.length > 0 && (
                  <em className="text-destructive text-sm">
                    {field.state.meta.errors
                      .map((err) =>
                        typeof err === "string" ? err : err?.message,
                      )
                      .join(", ")}
                  </em>
                )}
              </div>
            )}
          />

          <form.Field
            name="timeLimitSeconds"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Time Limit (minutes): {field.state.value}
                </Label>
                <Slider
                  id={field.name}
                  min={1}
                  max={120}
                  step={1}
                  value={[field.state.value || 30]}
                  onValueChange={(value) => field.handleChange(value[0])}
                />
              </div>
            )}
          />

          <form.Field
            name="proctoringLevel"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Proctoring Level</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "none" | "basic" | "strict")
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select proctoring level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <div className="space-y-2">
            <Label>Participant Fields</Label>
            <form.Field
              name="includeName"
              children={(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeName"
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <Label htmlFor="includeName">Name</Label>
                </div>
              )}
            />
            <form.Field
              name="includeEmail"
              children={(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeEmail"
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <Label htmlFor="includeEmail">Email</Label>
                </div>
              )}
            />
          </div>

          <Button type="submit" disabled={createRoomMutation.isPending}>
            {createRoomMutation.isPending ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
