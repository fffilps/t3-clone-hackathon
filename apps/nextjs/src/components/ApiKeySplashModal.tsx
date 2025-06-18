"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLinkIcon, KeyIcon, SparklesIcon, ZapIcon } from "lucide-react";

const ApiKeySplashModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState(false);

  useEffect(() => {
    if (user) {
      checkApiKeys();
    }
  }, [user]);

  const checkApiKeys = async () => {
    if (!user) return;

    try {
      // Check for any API keys
      const [profileResult, openRouterResult] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("openai_api_key, google_gemini_api_key, anthropic_api_key")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_api_keys")
          .select("api_key_encrypted")
          .eq("user_id", user.id)
          .eq("provider", "openrouter")
          .maybeSingle(),
      ]);

      const hasDirectKeys =
        profileResult.data &&
        (profileResult.data.openai_api_key ||
          profileResult.data.google_gemini_api_key ||
          profileResult.data.anthropic_api_key);
      const hasOpenRouter = openRouterResult.data?.api_key_encrypted;

      setHasApiKeys(Boolean(hasDirectKeys || hasOpenRouter));

      // Show modal if user has no API keys
      if (!hasDirectKeys && !hasOpenRouter) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error checking API keys:", error);
    }
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    router.push("/settings?tab=api-keys");
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <SparklesIcon className="h-6 w-6 text-primary" />
            Welcome to AI Chat!
          </DialogTitle>
          <DialogDescription className="text-base">
            To get started with AI conversations, you'll need to add an API key.
            We recommend starting with OpenRouter for the best experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* OpenRouter Recommendation */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-primary" />
                Recommended: OpenRouter
                <Badge variant="secondary" className="ml-auto">
                  BEST CHOICE
                </Badge>
              </CardTitle>
              <CardDescription>
                OpenRouter provides access to multiple AI models (GPT-4, Claude,
                Gemini) through a single API key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Get your API key from</p>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    OpenRouter Dashboard
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                </div>
                <Button
                  onClick={handleGoToSettings}
                  className="bg-primary hover:bg-primary/90"
                >
                  <KeyIcon className="mr-2 h-4 w-4" />
                  Add OpenRouter Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ZapIcon className="h-5 w-5" />
                Alternative Options
              </CardTitle>
              <CardDescription>
                You can also use direct API keys from individual providers for
                better performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-sm font-medium">OpenAI</div>
                  <div className="text-xs text-muted-foreground">
                    GPT-4, GPT-3.5
                  </div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-sm font-medium">Anthropic</div>
                  <div className="text-xs text-muted-foreground">
                    Claude 3.5, Claude 3
                  </div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-sm font-medium">Google</div>
                  <div className="text-xs text-muted-foreground">
                    Gemini Pro, Gemini Flash
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button
              onClick={handleGoToSettings}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <KeyIcon className="mr-2 h-4 w-4" />
              Set Up API Keys
            </Button>
            <Button onClick={handleSkip} variant="outline" className="flex-1">
              Maybe Later
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-center text-xs text-muted-foreground">
            You can always add API keys later in the Settings → API Keys tab
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySplashModal;
