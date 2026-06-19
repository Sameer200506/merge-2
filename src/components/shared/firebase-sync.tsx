"use client";

import { useEffect } from "react";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useLeadsStore } from "@/stores/leads.store";
import { useChatStore } from "@/stores/chat.store";
import { useShiftsStore } from "@/stores/shifts.store";
import type { Lead, ChatMessage, Shift } from "@/types";

export function FirebaseSync() {
  const { setLeads } = useLeadsStore();
  const { setMessages } = useChatStore();
  const { setActiveShifts, setShifts } = useShiftsStore();

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    console.log("🔥 Firebase Sync active — Listening to Firestore in real-time...");

    // 1. Sync Leads
    const unsubscribeLeads = onSnapshot(
      collection(db, "leads"),
      (snapshot) => {
        const leadsList: Lead[] = [];
        snapshot.forEach((doc) => {
          leadsList.push({ id: doc.id, ...doc.data() } as Lead);
        });
        // Sort leads by created time descending
        leadsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeads(leadsList);
      },
      (error) => {
        console.error("Firestore leads sync error:", error);
      }
    );

    // 2. Sync Chat Messages
    const chatQuery = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribeChats = onSnapshot(
      chatQuery,
      (snapshot) => {
        const messagesList: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        setMessages(messagesList);
      },
      (error) => {
        console.error("Firestore chats sync error:", error);
      }
    );

    // 3. Sync Active Shifts
    const unsubscribeActiveShifts = onSnapshot(
      collection(db, "activeShifts"),
      (snapshot) => {
        const activeList: Shift[] = [];
        snapshot.forEach((doc) => {
          activeList.push({ id: doc.id, ...doc.data() } as Shift);
        });
        setActiveShifts(activeList);
      },
      (error) => {
        console.error("Firestore activeShifts sync error:", error);
      }
    );

    // 4. Sync Shift History
    const shiftsQuery = query(collection(db, "shifts"), orderBy("startTime", "desc"));
    const unsubscribeShifts = onSnapshot(
      shiftsQuery,
      (snapshot) => {
        const shiftsList: Shift[] = [];
        snapshot.forEach((doc) => {
          shiftsList.push({ id: doc.id, ...doc.data() } as Shift);
        });
        setShifts(shiftsList);
      },
      (error) => {
        console.error("Firestore shifts sync error:", error);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeLeads();
      unsubscribeChats();
      unsubscribeActiveShifts();
      unsubscribeShifts();
      console.log("🛑 Firebase Sync listeners closed.");
    };
  }, [setLeads, setMessages, setActiveShifts, setShifts]);

  // This is a utility sync component, it has no UI render output.
  return null;
}
