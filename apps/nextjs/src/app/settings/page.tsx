"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountTab from "@/components/settings/AccountTab";
import ApiKeysTab from "@/components/settings/ApiKeysTab";
import CustomizationTab from "@/components/settings/CustomizationTab";
import HistorySyncTab from "@/components/settings/HistorySyncTab";
import ModelsTab from "@/components/settings/ModelsTab";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeftIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">(
    "system",
  );
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    // Get current theme from localStorage or default to system
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark" | "system") ||
      "system";
    setCurrentTheme(savedTheme);
  }, []);

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);

    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  const getThemeIcon = () => {
    switch (currentTheme) {
      case "light":
        return <SunIcon className="h-4 w-4" />;
      case "dark":
        return <MoonIcon className="h-4 w-4" />;
      default:
        return <MonitorIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/chat")}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Chat
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {getThemeIcon()}
                  Theme
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                  <SunIcon className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                  <MoonIcon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                  <MonitorIcon className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="mx-auto max-w-4xl p-4">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Manage your account, preferences, and chat configuration
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 bg-slate-200 dark:bg-slate-900">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
            <TabsTrigger value="history">History & Sync</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          <Suspense>
            <TabsContent value="account">
              <AccountTab searchParams={{ canceled: "" }} />
            </TabsContent>
          </Suspense>

          <TabsContent value="customization">
            <CustomizationTab />
          </TabsContent>

          <TabsContent value="history">
            <HistorySyncTab />
          </TabsContent>

          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
