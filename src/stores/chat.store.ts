"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, PingedEntity } from "@/types";

interface ActiveChannel {
  type: "public" | "private";
  userId?: string; // Set when type is "private"
}

interface ChatState {
  isOpen: boolean;
  activeChannel: ActiveChannel;
  messages: ChatMessage[];
  // Actions
  setIsOpen: (open: boolean) => void;
  setActiveChannel: (channel: ActiveChannel) => void;
  sendMessage: (
    senderId: string,
    senderName: string,
    content: string,
    recipientId?: string,
    pingedEntities?: PingedEntity[]
  ) => void;
  clearMessages: () => void;
}

const INITIAL_MOCK_MESSAGES: ChatMessage[] = [
  // Public channel messages
  {
    id: "msg_pub_1",
    senderId: "user_3", // James Park
    senderName: "James Park",
    content: "Hey team! Did we finalize the migration schedule for Vercel?",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
  },
  {
    id: "msg_pub_2",
    senderId: "user_2", // Sarah Chen
    senderName: "Sarah Chen",
    content: "Yes, James! Staging deployment is set for next Monday. Check out the project details here:",
    timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    pingedEntities: [
      { type: "project", id: "proj_1", name: "Vercel Platform Migration" }
    ],
  },
  {
    id: "msg_pub_3",
    senderId: "user_5", // Mike Torres
    senderName: "Mike Torres",
    content: "I'll be taking care of the QA checklist and test suites.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "msg_pub_4",
    senderId: "user_1", // Alex Morgan
    senderName: "Alex Morgan",
    content: "Excellent. Let's make sure the proposal is ready for their final signature.",
    timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    pingedEntities: [
      { type: "deal", id: "deal_5", name: "Vercel — Annual Renewal" }
    ]
  },
  {
    id: "msg_pub_5",
    senderId: "user_4", // Priya Sharma
    senderName: "Priya Sharma",
    content: "Firebase auth setup is fully completed on staging! Let's double check if we need more test accounts.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    pingedEntities: [
      { type: "task", id: "task_1", name: "Set up authentication flow" }
    ]
  },

  // Private messages between Alex Morgan (user_1) and Sarah Chen (user_2)
  {
    id: "msg_priv_1",
    senderId: "user_2",
    senderName: "Sarah Chen",
    recipientId: "user_1",
    content: "Hi Alex, the proposal for the Anthropic enterprise tier is ready for review.",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: "msg_priv_2",
    senderId: "user_1",
    senderName: "Alex Morgan",
    recipientId: "user_2",
    content: "Looks clean, Sarah! Let's schedule a call tomorrow morning to present it.",
    timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(),
  },

  // Private messages between James Park (user_3) and Priya Sharma (user_4)
  {
    id: "msg_priv_3",
    senderId: "user_3",
    senderName: "James Park",
    recipientId: "user_4",
    content: "Hi Priya, could you look into the API block issue for GitHub integration?",
    timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "msg_priv_4",
    senderId: "user_4",
    senderName: "Priya Sharma",
    recipientId: "user_3",
    content: "Yes James, I'm working on that right now. It is linked to this task:",
    timestamp: new Date(Date.now() - 3600000 * 9.5).toISOString(),
    pingedEntities: [
      { type: "task", id: "task_4", name: "API documentation" }
    ]
  }
];

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      activeChannel: { type: "public" },
      messages: INITIAL_MOCK_MESSAGES,

      setIsOpen: (open) => set({ isOpen: open }),
      setActiveChannel: (channel) => set({ activeChannel: channel }),

      sendMessage: (senderId, senderName, content, recipientId, pingedEntities) => {
        set((state) => {
          const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            senderId,
            senderName,
            recipientId,
            content,
            timestamp: new Date().toISOString(),
            pingedEntities,
          };
          return {
            messages: [...state.messages, newMessage],
          };
        });
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "startupos-chat-store",
    }
  )
);
