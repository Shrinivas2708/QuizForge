// components/ProcessingMessage.tsx
import { Loader2, FileSearch, Brain } from 'lucide-react';

export const ProcessingMessage = () => {
  return (
    <div className="p-6 border rounded-lg space-y-3 bg-muted/30">
      <div className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        <h3 className="font-semibold">Processing your document...</h3>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground pl-8">
        <div className="flex items-center gap-2">
          <FileSearch className="size-4" />
          <span>Extracting text content</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="size-4" />
          <span>Creating intelligent embeddings</span>
        </div>
      </div>
    </div>
  );
};