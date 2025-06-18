"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Check, Copy, Edit, ThumbsDown, ThumbsUp } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  content: string;
  thumbsUp?: number;
  thumbsDown?: number;
  onEdit?: (messageId: string) => void;
}

const MessageActions = ({
  messageId,
  content,
  thumbsUp = 0,
  thumbsDown = 0,
  onEdit,
}: MessageActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [localThumbsUp, setLocalThumbsUp] = useState(thumbsUp);
  const [localThumbsDown, setLocalThumbsDown] = useState(thumbsDown);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const handleThumbsUp = async () => {
    if (!user) return;

    try {
      let newThumbsUp = localThumbsUp;
      let newThumbsDown = localThumbsDown;

      if (userVote === "up") {
        // Remove upvote
        newThumbsUp = Math.max(0, newThumbsUp - 1);
        setUserVote(null);
      } else {
        // Add upvote
        newThumbsUp += 1;
        if (userVote === "down") {
          // Remove previous downvote
          newThumbsDown = Math.max(0, newThumbsDown - 1);
        }
        setUserVote("up");
      }

      setLocalThumbsUp(newThumbsUp);
      setLocalThumbsDown(newThumbsDown);

      // Update in database
      const { error } = await supabase
        .from("messages")
        .update({
          thumbs_up: newThumbsUp,
          thumbs_down: newThumbsDown,
        })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: userVote === "up" ? "Removed upvote" : "Added upvote",
        description:
          userVote === "up"
            ? "Your upvote has been removed"
            : "Your upvote has been recorded",
      });
    } catch (error) {
      console.error("Error updating thumbs up:", error);
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive",
      });
    }
  };

  const handleThumbsDown = async () => {
    if (!user) return;

    try {
      let newThumbsUp = localThumbsUp;
      let newThumbsDown = localThumbsDown;

      if (userVote === "down") {
        // Remove downvote
        newThumbsDown = Math.max(0, newThumbsDown - 1);
        setUserVote(null);
      } else {
        // Add downvote
        newThumbsDown += 1;
        if (userVote === "up") {
          // Remove previous upvote
          newThumbsUp = Math.max(0, newThumbsUp - 1);
        }
        setUserVote("down");
      }

      setLocalThumbsUp(newThumbsUp);
      setLocalThumbsDown(newThumbsDown);

      // Update in database
      const { error } = await supabase
        .from("messages")
        .update({
          thumbs_up: newThumbsUp,
          thumbs_down: newThumbsDown,
        })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: userVote === "down" ? "Removed downvote" : "Added downvote",
        description:
          userVote === "down"
            ? "Your downvote has been removed"
            : "Your downvote has been recorded",
      });
    } catch (error) {
      console.error("Error updating thumbs down:", error);
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 hover:bg-secondary"
      >
        {isCopied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>

      {/* Thumbs Up */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleThumbsUp}
        className={`h-8 px-2 hover:bg-secondary ${
          userVote === "up"
            ? "bg-green-50 text-green-600 dark:bg-green-950"
            : ""
        }`}
      >
        <ThumbsUp className="mr-1 h-3 w-3" />
        {localThumbsUp > 0 && <span className="text-xs">{localThumbsUp}</span>}
      </Button>

      {/* Thumbs Down */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleThumbsDown}
        className={`h-8 px-2 hover:bg-secondary ${
          userVote === "down" ? "bg-red-50 text-red-600 dark:bg-red-950" : ""
        }`}
      >
        <ThumbsDown className="mr-1 h-3 w-3" />
        {localThumbsDown > 0 && (
          <span className="text-xs">{localThumbsDown}</span>
        )}
      </Button>

      {/* Edit Button (only for user messages) */}
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(messageId)}
          className="h-8 w-8 p-0 hover:bg-secondary"
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default MessageActions;
