"use client";

import { useState } from "react";
import { NewDealSheet } from "@/components/shared/new-deal-sheet";
import { ActionMenu } from "@/components/shared/action-menu";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Grip,
  Table2,
  Star,
  ChevronDown,
  Filter,
  Tag,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { mockDeals, mockPipeline, mockCustomers, getUserById } from "@/lib/mock-data";
import type { Deal, DealPriority } from "@/types";
import { useState as useStateGlobal } from "react";

const priorityConfig: Record<DealPriority, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "text-red-500", dot: "bg-red-500" },
  high: { label: "High", color: "text-orange-500", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-yellow-500", dot: "bg-yellow-500" },
  low: { label: "Low", color: "text-green-500", dot: "bg-green-500" },
};

// ── Deal Card ─────────────────────────────────────────────────
function DealCard({
  deal,
  isDragging = false,
}: {
  deal: Deal;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const customer = mockCustomers.find((c) => c.id === deal.customerId);
  const owner = getUserById(deal.ownerId);
  const priority = priorityConfig[deal.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("kanban-card p-3 mb-2 select-none", isDragging && "shadow-2xl rotate-1 scale-105")}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priority.dot)} />
          <p className="text-[13px] font-medium text-[var(--foreground)] leading-tight truncate">
            {deal.title}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button {...listeners} className="p-0.5 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] cursor-grab active:cursor-grabbing">
            <Grip size={12} />
          </button>
          <ActionMenu actions={[
            { label: "Edit Deal", icon: Pencil, onClick: () => toast.info("Edit deal feature coming soon") },
            { label: "Delete Deal", icon: Trash2, danger: true, onClick: () => toast.success("Deal deleted") },
          ]} />
        </div>
      </div>

      {customer && (
        <p className="text-[11.5px] text-[var(--foreground-muted)] mb-2 flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[var(--background-muted)] inline-flex items-center justify-center text-[8px] font-bold text-[var(--foreground-subtle)]">
            {getInitials(customer.name)[0]}
          </span>
          {customer.name}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold text-[var(--foreground)]">
          {formatCurrency(deal.value)}
        </p>
        {deal.score !== undefined && (
          <span className={cn(
            "text-[10.5px] font-medium px-1.5 py-0.5 rounded",
            deal.score >= 70 ? "badge-success" : deal.score >= 40 ? "badge-warning" : "badge-danger"
          )}>
            {deal.score}%
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          {deal.expectedCloseDate && (
            <span className="flex items-center gap-1 text-[10.5px] text-[var(--foreground-subtle)]">
              <Calendar size={10} />
              {formatDate(deal.expectedCloseDate)}
            </span>
          )}
        </div>
        <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-white">
          {owner ? getInitials(owner.displayName) : "?"}
        </div>
      </div>
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────
function KanbanColumn({
  stageId,
  title,
  color,
  deals,
}: {
  stageId: string;
  title: string;
  color: string;
  deals: Deal[];
}) {
  const totalValue = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="kanban-col flex-shrink-0 w-[272px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-[12.5px] font-semibold text-[var(--foreground)]">{title}</span>
          <span className="text-[11px] text-[var(--foreground-subtle)] bg-[var(--background-muted)] px-1.5 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <button className="sos-btn sos-btn-ghost p-1">
          <Plus size={13} />
        </button>
      </div>

      {/* Total */}
      {deals.length > 0 && (
        <p className="text-[11px] text-[var(--foreground-subtle)] px-3 pb-2">
          {formatCurrency(totalValue)}
        </p>
      )}

      {/* Cards */}
      <div className="flex-1 px-2 pb-2 overflow-y-auto">
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[12px] text-[var(--foreground-subtle)] border-2 border-dashed border-[var(--border)] rounded-lg mx-1">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Table View ─────────────────────────────────────────────────
function TableView({ deals }: { deals: Deal[] }) {
  return (
    <div className="sos-card overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2 bg-[var(--background-subtle)] border-b border-[var(--border)]">
        {["Deal", "Customer", "Value", "Stage", "Priority", "Score", "Close Date", "Owner"].map((h) => (
          <p key={h} className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] flex-1">
            {h}
          </p>
        ))}
      </div>
      {deals.map((deal) => {
        const customer = mockCustomers.find((c) => c.id === deal.customerId);
        const owner = getUserById(deal.ownerId);
        const stage = mockPipeline.stages.find((s) => s.id === deal.stageId);
        const priority = priorityConfig[deal.priority];
        return (
          <div key={deal.id} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--background-subtle)] transition-colors">
            <p className="text-[13px] font-medium text-[var(--foreground)] flex-1 truncate">{deal.title}</p>
            <p className="text-[12.5px] text-[var(--foreground-muted)] flex-1 truncate">{customer?.name ?? "—"}</p>
            <p className="text-[13px] font-semibold text-[var(--foreground)] flex-1">{formatCurrency(deal.value)}</p>
            <p className="text-[12px] text-[var(--foreground-muted)] flex-1">{stage?.name ?? "—"}</p>
            <span className={cn("text-[11px] font-medium flex-1", priority.color)}>{priority.label}</span>
            <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded flex-1 text-center w-fit",
              (deal.score ?? 0) >= 70 ? "badge-success" : (deal.score ?? 0) >= 40 ? "badge-warning" : "badge-danger"
            )}>
              {deal.score}%
            </span>
            <p className="text-[12px] text-[var(--foreground-muted)] flex-1">
              {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
            </p>
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-white">
                {owner ? getInitials(owner.displayName) : "?"}
              </div>
              <span className="text-[12px] text-[var(--foreground-muted)] truncate">{owner?.displayName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Pipeline ─────────────────────────────────────────────
export default function PipelinePage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [deals, setDeals] = useState(mockDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newDealOpen, setNewDealOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const totalPipelineValue = deals
    .filter((d) => !d.isWon && !d.isLost)
    .reduce((s, d) => s + d.value * (d.probability / 100), 0);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    // Find target stage via column
    const overDeal = deals.find((d) => d.id === over.id);
    if (overDeal) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === active.id ? { ...d, stageId: overDeal.stageId } : d
        )
      );
    }
  };

  const activeDeal = deals.find((d) => d.id === activeId);

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            {formatCurrency(totalPipelineValue)} weighted forecast · {deals.filter((d) => !d.isWon && !d.isLost).length} active deals
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--background-muted)] border border-[var(--border)] rounded-lg p-0.5 gap-0.5">
            {(["kanban", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5",
                  view === v
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--foreground-muted)]"
                )}
              >
                {v === "kanban" ? <Grip size={13} /> : <Table2 size={13} />}
                <span className="hidden sm:inline capitalize">{v}</span>
              </button>
            ))}
          </div>
          <button className="sos-btn sos-btn-outline py-1.5 px-3 text-[12.5px]">
            <Filter size={12} /> Filter
          </button>
          <button
            onClick={() => setNewDealOpen(true)}
            className="sos-btn sos-btn-primary"
          >
            <Plus size={13} /> New Deal
          </button>
        </div>
      </div>

      {/* Revenue bar */}
      <div className="flex items-center gap-4 mb-4 p-3 sos-card">
        {mockPipeline.stages.slice(0, 5).map((stage) => {
          const stageValue = deals
            .filter((d) => d.stageId === stage.id)
            .reduce((s, d) => s + d.value, 0);
          return (
            <div key={stage.id} className="flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
              <span className="text-[var(--foreground-muted)]">{stage.name}</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(stageValue)}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
            {mockPipeline.stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stageId={stage.id}
                title={stage.name}
                color={stage.color}
                deals={deals.filter((d) => d.stageId === stage.id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal && <DealCard deal={activeDeal} isDragging />}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView deals={deals} />
      )}

      <NewDealSheet open={newDealOpen} onClose={() => setNewDealOpen(false)} />
    </div>
  );
}
