"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

import { AppSidebar } from "~/components/app-sidebar";
import { Thread } from "~/components/assistant-ui/thread";
import {
  GeocodeLocationToolUI,
  WeatherSearchToolUI,
} from "~/components/tools/weather-tool";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider className="">
        {" "}
        {/* TODO: Fix the top and side navbar, as they clash together. Needs to be space and seperated */}
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className="w-full">
              <BreadcrumbList className="flex w-full items-center gap-2 px-12">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Build Your Own ChatGPT UX
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Starter Template</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <Thread />
          <GeocodeLocationToolUI />
          <WeatherSearchToolUI />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
