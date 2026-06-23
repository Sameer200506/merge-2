"use client";

import { useEffect } from "react";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { useLeadsStore } from "@/stores/leads.store";
import { useChatStore } from "@/stores/chat.store";
import { useShiftsStore } from "@/stores/shifts.store";
import { useAuthStore } from "@/stores/auth.store";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import type { Lead, ChatMessage, Shift, Space, Document, DocumentVersion, DocumentComment, DocumentTemplate } from "@/types";
import { toast } from "sonner";

export function FirebaseSync() {
  const { setLeads } = useLeadsStore();
  const { setMessages } = useChatStore();
  const { setActiveShifts, setShifts } = useShiftsStore();
  const { user, sessionId, logout } = useAuthStore();
  const { setSpaces, setDocuments, setVersions, setComments, setTemplates } = useKnowledgeStore();

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

    // 5. Sync Knowledge Spaces
    const unsubscribeSpaces = onSnapshot(
      collection(db, "spaces"),
      (snapshot) => {
        const list: Space[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Space);
        });
        setSpaces(list);
      },
      (error) => console.error("Firestore spaces sync error:", error)
    );

    // 6. Sync Knowledge Documents
    const unsubscribeDocs = onSnapshot(
      collection(db, "documents"),
      (snapshot) => {
        const list: Document[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Document);
        });
        setDocuments(list);
      },
      (error) => console.error("Firestore docs sync error:", error)
    );

    // 7. Sync Knowledge Versions
    const unsubscribeVersions = onSnapshot(
      collection(db, "documentVersions"),
      (snapshot) => {
        const list: DocumentVersion[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as DocumentVersion);
        });
        setVersions(list);
      },
      (error) => console.error("Firestore versions sync error:", error)
    );

    // 8. Sync Knowledge Comments
    const unsubscribeComments = onSnapshot(
      collection(db, "documentComments"),
      (snapshot) => {
        const list: DocumentComment[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as DocumentComment);
        });
        setComments(list);
      },
      (error) => console.error("Firestore comments sync error:", error)
    );

    // 9. Sync Knowledge Templates
    const unsubscribeTemplates = onSnapshot(
      collection(db, "documentTemplates"),
      (snapshot) => {
        const list: DocumentTemplate[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as DocumentTemplate);
        });
        setTemplates(list);
      },
      (error) => console.error("Firestore templates sync error:", error)
    );

    // 10. Sync Session Lock (Prevent Concurrent Logins)
    let unsubscribeSession = () => {};
    if (user && sessionId) {
      unsubscribeSession = onSnapshot(
        doc(db, "sessions", user.id),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.sessionId && data.sessionId !== sessionId) {
              console.warn("⚠️ Device session conflict detected. Logging out...");
              logout();
              toast.error("Session Terminated: This account has been logged in from another device.", {
                duration: 6000,
              });
            }
          }
        },
        (error) => {
          console.error("Firestore session lock sync error:", error);
        }
      );
    }

    // Cleanup listeners on unmount
    return () => {
      unsubscribeLeads();
      unsubscribeChats();
      unsubscribeActiveShifts();
      unsubscribeShifts();
      unsubscribeSpaces();
      unsubscribeDocs();
      unsubscribeVersions();
      unsubscribeComments();
      unsubscribeTemplates();
      unsubscribeSession();
      console.log("🛑 Firebase Sync listeners closed.");
    };
  }, [
    setLeads,
    setMessages,
    setActiveShifts,
    setShifts,
    setSpaces,
    setDocuments,
    setVersions,
    setComments,
    setTemplates,
    user,
    sessionId,
    logout,
  ]);

  return null;
}
