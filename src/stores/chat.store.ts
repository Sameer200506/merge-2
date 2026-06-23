"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, PingedEntity } from "@/types";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

interface ActiveChannel {
  type: "public" | "private";
  userId?: string; // Set when type is "private"
}

interface ChatState {
  isOpen: boolean;
  activeChannel: ActiveChannel;
  messages: ChatMessage[];
  lastReadTimes: Record<string, string>;
  // Actions
  setIsOpen: (open: boolean) => void;
  setActiveChannel: (channel: ActiveChannel) => void;
  setMessages: (messages: ChatMessage[]) => void;
  sendMessage: (
    senderId: string,
    senderName: string,
    content: string,
    recipientId?: string,
    pingedEntities?: PingedEntity[]
  ) => void;
  clearMessages: () => void;
  markChannelAsRead: (channelKey: string) => void;
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
    (set, get) => ({
      isOpen: false,
      activeChannel: { type: "public" },
      messages: INITIAL_MOCK_MESSAGES,
      lastReadTimes: {
        public: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago by default
      },

      setIsOpen: (open) => {
        set({ isOpen: open });
        if (open) {
          const { activeChannel, markChannelAsRead } = get();
          const key = activeChannel.type === "public" ? "public" : `private:${activeChannel.userId}`;
          markChannelAsRead(key);
        }
      },
      setActiveChannel: (channel) => {
        set({ activeChannel: channel });
        if (get().isOpen) {
          const key = channel.type === "public" ? "public" : `private:${channel.userId}`;
          get().markChannelAsRead(key);
        }
      },
      setMessages: (messages) => set({ messages }),

      sendMessage: (senderId, senderName, content, recipientId, pingedEntities) => {
        const newMessage = {
          senderId,
          senderName,
          recipientId: recipientId || null,
          content,
          timestamp: new Date().toISOString(),
          pingedEntities: pingedEntities || null,
        };

        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              const docRef = doc(collection(db, "chats"));
              await setDoc(docRef, { ...newMessage, id: docRef.id });
            } catch (e) {
              console.error("Firestore sendMessage error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => ({
          messages: [
            ...state.messages,
            { ...newMessage, id: `msg_${Date.now()}` } as ChatMessage,
          ],
        }));
      },

      clearMessages: () => {
        if (isFirebaseConfigured && db) {
          // Typically we wouldn't delete all from Firestore in UI, 
          // but we can clear local state representation
        }
        set({ messages: [] });
      },

      markChannelAsRead: (channelKey) => {
        set((state) => ({
          lastReadTimes: {
            ...state.lastReadTimes,
            [channelKey]: new Date().toISOString(),
          }
        }));
      },
    }),
    {
      name: "startupos-chat-store",
    }
  )
);
