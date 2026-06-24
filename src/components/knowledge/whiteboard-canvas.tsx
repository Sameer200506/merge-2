"use client";

import { useState, useEffect, useRef } from "react";
import {
  MousePointer,
  PenTool,
  Square,
  Circle as CircleIcon,
  Minus,
  ArrowRight,
  Type,
  Trash2,
  Undo2,
  Redo2,
  Users,
  Palette,
  Check,
  Eraser,
  Hand,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { mockUsers } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhiteboardCanvasProps {
  canvasData?: string;
  onChange: (data: string) => void;
  spaceId: string;
  spaceName: string;
}

interface Point {
  x: number;
  y: number;
}

interface CanvasElement {
  id: string;
  type: "pencil" | "rectangle" | "ellipse" | "line" | "arrow" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Point[]; // For freehand pencil drawing
  text?: string;
  stroke: string;
  fill: string;
  strokeWidth: number;
}

// ── Math & Position Helper Functions ─────────────────────────────────

const distanceToSegment = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

const isNearPoint = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) < 8;
};

const isNearPencil = (x: number, y: number, points: Point[]) => {
  return points.some((p) => isNearPoint(x, y, p.x, p.y));
};

const isInsideRect = (x: number, y: number, rx: number, ry: number, rw: number, rh: number) => {
  const minX = Math.min(rx, rx + rw);
  const maxX = Math.max(rx, rx + rw);
  const minY = Math.min(ry, ry + rh);
  const maxY = Math.max(ry, ry + rh);
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
};

const isInsideEllipse = (x: number, y: number, ex: number, ey: number, ew: number, eh: number) => {
  const cx = ex + ew / 2;
  const cy = ey + eh / 2;
  const rx = Math.abs(ew / 2);
  const ry = Math.abs(eh / 2);
  if (rx === 0 || ry === 0) return false;
  const normX = (x - cx) / rx;
  const normY = (y - cy) / ry;
  return normX * normX + normY * normY <= 1.1; // 10% margin
};

const isInsideText = (x: number, y: number, tx: number, ty: number, fontSize: number, text: string) => {
  const estimatedHeight = fontSize;
  const estimatedWidth = text.length * fontSize * 0.6;
  return x >= tx && x <= tx + estimatedWidth && y >= ty - estimatedHeight && y <= ty;
};

const getElementAtPosition = (x: number, y: number, elements: CanvasElement[]) => {
  // Search in reverse order to select the topmost element first
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.type === "pencil" && el.points && isNearPencil(x, y, el.points)) {
      return el;
    }
    if (el.type === "rectangle" && isInsideRect(x, y, el.x, el.y, el.width, el.height)) {
      return el;
    }
    if (el.type === "ellipse" && isInsideEllipse(x, y, el.x, el.y, el.width, el.height)) {
      return el;
    }
    if (el.type === "line" && distanceToSegment(x, y, el.x, el.y, el.x + el.width, el.y + el.height) < 8) {
      return el;
    }
    if (el.type === "arrow" && distanceToSegment(x, y, el.x, el.y, el.x + el.width, el.y + el.height) < 8) {
      return el;
    }
    if (el.type === "text" && el.text && isInsideText(x, y, el.x, el.y, el.strokeWidth * 6 + 10, el.text)) {
      return el;
    }
  }
  return null;
};

const getElementBounds = (el: CanvasElement) => {
  if (el.type === "pencil" && el.points) {
    const xs = el.points.map((p) => p.x);
    const ys = el.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  } else {
    const x = Math.min(el.x, el.x + el.width);
    const y = Math.min(el.y, el.y + el.height);
    const width = Math.abs(el.width);
    const height = Math.abs(el.height);
    return { x, y, width, height };
  }
};

export function WhiteboardCanvas({ canvasData, onChange, spaceId, spaceName }: WhiteboardCanvasProps) {
  const { user: currentUser } = useAuthStore();
  const { sendMessage } = useChatStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tools & Styling States
  const [tool, setTool] = useState<CanvasElement["type"] | "pointer" | "eraser" | "hand">("pencil");
  const [strokeColor, setStrokeColor] = useState("#3b82f6"); // Default blue
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Drawing state
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

  // Selection states
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const dragStartMouse = useRef<Point | null>(null);
  const dragStartElement = useRef<CanvasElement | null>(null);

  // Pan Offset state
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef<Point>({ x: 0, y: 0 });

  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Tracking serialized state to prevent loop reset
  const lastSerializedRef = useRef("");

  // Teammate Invitation State
  const [inviteOpen, setInviteOpen] = useState(false);

  // Colors available
  const STROKE_COLORS = [
    { name: "Blue", hex: "#3b82f6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Purple", hex: "#a855f7" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Orange", hex: "#f97316" },
    { name: "Charcoal", hex: "#1e293b" },
  ];

  const FILL_COLORS = [
    { name: "Transparent", hex: "transparent" },
    { name: "Blue Sub", hex: "rgba(59, 130, 246, 0.15)" },
    { name: "Emerald Sub", hex: "rgba(16, 185, 129, 0.15)" },
    { name: "Purple Sub", hex: "rgba(168, 85, 247, 0.15)" },
    { name: "Rose Sub", hex: "rgba(244, 63, 94, 0.15)" },
    { name: "Orange Sub", hex: "rgba(249, 115, 22, 0.15)" },
  ];

  // Reset whiteboard local parameters if document / space swaps
  useEffect(() => {
    setElements([]);
    setHistory([]);
    setHistoryIndex(-1);
    lastSerializedRef.current = "";
    setSelectedElementId(null);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  }, [spaceId]);

  // Parse initial canvas data
  useEffect(() => {
    if (canvasData && canvasData !== lastSerializedRef.current) {
      try {
        const parsed = JSON.parse(canvasData);
        if (Array.isArray(parsed)) {
          setElements(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
          lastSerializedRef.current = canvasData;
        }
      } catch (e) {
        console.error("Failed to parse canvasData:", e);
      }
    }
  }, [canvasData]);

  // Canvas Resize Handler (Only triggers on window resizing or mounting)
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 550;
      drawCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync canvas redraw loop with elements & state configurations
  useEffect(() => {
    drawCanvas();
  }, [elements, activeElement, textInput, panOffset, zoom, selectedElementId]);

  // Keyboard shortcut listener to delete selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const updated = elements.filter((el) => el.id !== selectedElementId);
        updateElementsState(updated);
        setSelectedElementId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, elements]);

  // Sync selection styles back to toolbar controls
  useEffect(() => {
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el) {
        setStrokeColor(el.stroke);
        setFillColor(el.fill);
        setStrokeWidth(el.strokeWidth);
      }
    }
  }, [selectedElementId]);

  // Main Canvas Rendering Loop
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // Panning & Zoom scaling
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw Grid Background for a nice Excalidraw aesthetic (scrolls dynamically with pan)
    ctx.strokeStyle = "var(--border)";
    ctx.lineWidth = 0.5 / zoom; // Maintain sharp grid lines at all zoom steps
    const gridSize = 30;

    const left = -panOffset.x / zoom;
    const right = (canvas.width - panOffset.x) / zoom;
    const top = -panOffset.y / zoom;
    const bottom = (canvas.height - panOffset.y) / zoom;

    const startX = Math.floor(left / gridSize) * gridSize;
    const startY = Math.floor(top / gridSize) * gridSize;

    for (let x = startX; x < right; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    for (let y = startY; y < bottom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // Render all committed elements
    elements.forEach((el) => renderElement(ctx, el));

    // Render selection indicator dashed frame
    if (selectedElementId) {
      const selectedEl = elements.find((el) => el.id === selectedElementId);
      if (selectedEl) {
        const bounds = getElementBounds(selectedEl);
        ctx.strokeStyle = "#3b82f6"; // selection blue
        ctx.lineWidth = 1 / zoom; // Maintain uniform selection bounds outline
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.beginPath();
        ctx.rect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Render active temporary drawing element
    if (activeElement) {
      renderElement(ctx, activeElement);
    }

    ctx.restore();
  };

  // Render Individual Element on Canvas
  const renderElement = (ctx: CanvasRenderingContext2D, el: CanvasElement) => {
    ctx.strokeStyle = el.stroke;
    ctx.fillStyle = el.fill;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (el.type) {
      case "pencil":
        if (el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case "rectangle":
        ctx.beginPath();
        ctx.rect(el.x, el.y, el.width, el.height);
        if (el.fill !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case "ellipse":
        ctx.beginPath();
        const rx = Math.abs(el.width / 2);
        const ry = Math.abs(el.height / 2);
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (el.fill !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case "line":
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
        break;

      case "arrow":
        const fromX = el.x;
        const fromY = el.y;
        const toX = el.x + el.width;
        const toY = el.y + el.height;
        const headLength = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Draw shaft
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headLength * Math.cos(angle - Math.PI / 6),
          toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - headLength * Math.cos(angle + Math.PI / 6),
          toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = el.stroke;
        ctx.fill();
        break;

      case "text":
        if (el.text) {
          ctx.font = `${el.strokeWidth * 6 + 10}px Outfit, sans-serif`;
          ctx.fillStyle = el.stroke;
          ctx.fillText(el.text, el.x, el.y);
        }
        break;
    }
  };

  // Relative coordinate calculator (Accounts for Zoom and Pan offsets)
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle-click (1) or Space Key or Hand tool triggers panning
    if (e.button === 1 || tool === "hand") {
      isPanning.current = true;
      panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const { x, y } = getMouseCoords(e);

    // Pointer tool -> selection and dragging
    if (tool === "pointer") {
      const clickedEl = getElementAtPosition(x, y, elements);
      if (clickedEl) {
        setSelectedElementId(clickedEl.id);
        setIsDraggingElement(true);
        dragStartMouse.current = { x, y };
        dragStartElement.current = { ...clickedEl }; // deep copy properties
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    // Eraser tool -> Click to erase immediately
    if (tool === "eraser") {
      setIsDrawing(true);
      const clickedEl = getElementAtPosition(x, y, elements);
      if (clickedEl) {
        const updated = elements.filter((el) => el.id !== clickedEl.id);
        setElements(updated);
      }
      return;
    }

    if (tool === "text") {
      setTextInput({ x, y, text: "" });
      return;
    }

    setIsDrawing(true);

    const newElement: CanvasElement = {
      id: `el_${Date.now()}`,
      type: tool,
      x,
      y,
      width: 0,
      height: 0,
      points: tool === "pencil" ? [{ x, y }] : undefined,
      stroke: strokeColor,
      fill: fillColor,
      strokeWidth,
    };

    setActiveElement(newElement);
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      setPanOffset({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
      return;
    }

    const { x, y } = getMouseCoords(e);

    // Drag-move elements under Selection Pointer
    if (tool === "pointer" && isDraggingElement && dragStartElement.current && dragStartMouse.current) {
      const dx = x - dragStartMouse.current.x;
      const dy = y - dragStartMouse.current.y;
      const startEl = dragStartElement.current;

      let movedElement: CanvasElement;
      if (startEl.type === "pencil" && startEl.points) {
        movedElement = {
          ...startEl,
          x: startEl.x + dx,
          y: startEl.y + dy,
          points: startEl.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      } else {
        movedElement = {
          ...startEl,
          x: startEl.x + dx,
          y: startEl.y + dy,
        };
      }

      setElements((prev) => prev.map((el) => (el.id === startEl.id ? movedElement : el)));
      return;
    }

    // Drag-erase elements under Eraser tool
    if (tool === "eraser" && isDrawing) {
      const hoveredEl = getElementAtPosition(x, y, elements);
      if (hoveredEl) {
        const updated = elements.filter((el) => el.id !== hoveredEl.id);
        setElements(updated);
      }
      return;
    }

    if (!isDrawing || !activeElement) return;

    if (activeElement.type === "pencil") {
      const points = [...(activeElement.points || []), { x, y }];
      setActiveElement({
        ...activeElement,
        points,
      });
    } else {
      setActiveElement({
        ...activeElement,
        width: x - activeElement.x,
        height: y - activeElement.y,
      });
    }
  };

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }

    // Selection move completes
    if (tool === "pointer" && isDraggingElement) {
      setIsDraggingElement(false);
      dragStartMouse.current = null;
      dragStartElement.current = null;
      updateElementsState(elements);
      return;
    }

    // Eraser sweeps completes
    if (tool === "eraser" && isDrawing) {
      setIsDrawing(false);
      updateElementsState(elements);
      return;
    }

    if (!isDrawing || !activeElement) return;
    setIsDrawing(false);

    // Filter out tiny clicks (accidental taps)
    const isPencilWithPoints = activeElement.type === "pencil" && activeElement.points && activeElement.points.length > 2;
    const isShapeWithDimensions = activeElement.type !== "pencil" && (Math.abs(activeElement.width) > 3 || Math.abs(activeElement.height) > 3);

    if (isPencilWithPoints || isShapeWithDimensions) {
      const updatedElements = [...elements, activeElement];
      updateElementsState(updatedElements);
    }

    setActiveElement(null);
  };

  // Helper to commit new states to undo history and propagate changes
  const updateElementsState = (newElements: CanvasElement[]) => {
    setElements(newElements);
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newElements]);
    setHistoryIndex(newHistory.length);
    const serialized = JSON.stringify(newElements);
    lastSerializedRef.current = serialized;
    onChange(serialized);
  };

  // Modify Selected element stroke/fill style properties directly
  const changeSelectedElementProperty = (property: "stroke" | "fill" | "strokeWidth", value: any) => {
    if (!selectedElementId) return;
    const updated = elements.map((el) => {
      if (el.id === selectedElementId) {
        return { ...el, [property]: value };
      }
      return el;
    });
    updateElementsState(updated);
  };

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    if (selectedElementId) {
      changeSelectedElementProperty("stroke", color);
    }
  };

  const handleFillColorChange = (color: string) => {
    setFillColor(color);
    if (selectedElementId) {
      changeSelectedElementProperty("fill", color);
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    if (selectedElementId) {
      changeSelectedElementProperty("strokeWidth", width);
    }
  };

  // Handle Text Submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput && textInput.text.trim()) {
      const newTextElement: CanvasElement = {
        id: `el_${Date.now()}`,
        type: "text",
        x: textInput.x,
        y: textInput.y,
        width: 0,
        height: 0,
        text: textInput.text,
        stroke: strokeColor,
        fill: "transparent",
        strokeWidth,
      };

      const updatedElements = [...elements, newTextElement];
      updateElementsState(updatedElements);
    }
    setTextInput(null);
    setTool("pointer");
  };

  // Undo Action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setElements(history[prevIndex]);
      setSelectedElementId(null);
      const serialized = JSON.stringify(history[prevIndex]);
      lastSerializedRef.current = serialized;
      onChange(serialized);
    }
  };

  // Redo Action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setElements(history[nextIndex]);
      setSelectedElementId(null);
      const serialized = JSON.stringify(history[nextIndex]);
      lastSerializedRef.current = serialized;
      onChange(serialized);
    }
  };

  // Clear Board
  const handleClear = () => {
    const confirm = window.confirm("Are you sure you want to clear the whiteboard?");
    if (confirm) {
      setSelectedElementId(null);
      updateElementsState([]);
    }
  };

  // Invite Teammate Action (sends chat message and alerts user)
  const handleSendInvite = (recipientId: string, recipientName: string) => {
    if (!currentUser) return;

    const inviteMessage = `Hey ${recipientName}! I've set up a Whiteboard for us. Click the space reference to join and collaborate!`;
    const spacePing = {
      type: "space" as const,
      id: spaceId,
      name: spaceName,
    };

    sendMessage(
      currentUser.id,
      currentUser.displayName,
      inviteMessage,
      recipientId,
      [spacePing]
    );

    toast.success(`Sent invitation link to ${recipientName} via Chat!`);
    setInviteOpen(false);
  };

  const invitees = mockUsers.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="flex flex-col h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden relative shadow-sm">
      {/* Whiteboard Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--background-subtle)] flex-wrap gap-3">
        {/* Tool Selector */}
        <div className="flex items-center gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setTool("pointer")}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "pointer" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Selector (Pointer) - Click to select & move elements"
          >
            <MousePointer size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("pencil");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "pencil" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Pencil (Freehand)"
          >
            <PenTool size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("rectangle");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "rectangle" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Rectangle"
          >
            <Square size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("ellipse");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "ellipse" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Circle"
          >
            <CircleIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("line");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "line" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Line"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("arrow");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "arrow" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Arrow"
          >
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("text");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "text" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Text Tool"
          >
            <Type size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("eraser");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "eraser" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Eraser (Erase drawings)"
          >
            <Eraser size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTool("hand");
              setSelectedElementId(null);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] cursor-pointer",
              tool === "hand" && "bg-[var(--primary)] text-white hover:bg-[var(--primary)]"
            )}
            title="Hand (Pan Canvas)"
          >
            <Hand size={14} />
          </button>
        </div>

        {/* Styling controls (Stroke & Fill) */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Stroke color */}
          <div className="flex items-center gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
            <Palette size={13} className="text-[var(--foreground-subtle)] mx-1" />
            {STROKE_COLORS.map((sc) => (
              <button
                key={sc.hex}
                type="button"
                onClick={() => handleStrokeColorChange(sc.hex)}
                style={{ backgroundColor: sc.hex }}
                className={cn(
                  "w-4 h-4 rounded-full border border-black/10 flex items-center justify-center cursor-pointer transition-all hover:scale-110",
                  strokeColor === sc.hex && "ring-2 ring-[var(--primary)] ring-offset-1"
                )}
                title={`Stroke: ${sc.name}`}
              >
                {strokeColor === sc.hex && <Check size={8} className="text-white" />}
              </button>
            ))}
          </div>

          {/* Fill color */}
          <div className="flex items-center gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
            <Palette size={13} className="text-[var(--foreground-subtle)] mx-1" />
            {FILL_COLORS.map((fc) => (
              <button
                key={fc.hex}
                type="button"
                onClick={() => handleFillColorChange(fc.hex)}
                style={{ backgroundColor: fc.hex === "transparent" ? "transparent" : fc.hex }}
                className={cn(
                  "w-4 h-4 rounded-full border border-dashed flex items-center justify-center cursor-pointer transition-all hover:scale-110",
                  fc.hex === "transparent" && "border-slate-300 bg-linear-to-tr from-transparent via-red-300 to-transparent",
                  fillColor === fc.hex && "ring-2 ring-[var(--primary)] ring-offset-1 border-solid"
                )}
                title={`Fill: ${fc.name}`}
              >
                {fillColor === fc.hex && <Check size={8} className={fc.hex === "transparent" ? "text-slate-700" : "text-slate-800"} />}
              </button>
            ))}
          </div>

          {/* Line width */}
          <div className="flex items-center gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)] text-[12px] text-[var(--foreground-muted)] px-2 font-medium">
            <span>Stroke:</span>
            {[2, 4, 6].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleStrokeWidthChange(w)}
                className={cn(
                  "px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--background-muted)] font-mono",
                  strokeWidth === w && "bg-[var(--primary-subtle)] text-[var(--primary)] font-bold"
                )}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        {/* History & Zoom & Collaborators Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)] text-[12px] text-[var(--foreground-muted)]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.1).toFixed(1))))}
              className="p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--background-muted)] font-mono font-bold text-[10px] cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(1))))}
              className="p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <span className="w-[1px] h-6 bg-[var(--border)] mx-1" />

          {/* Delete Selection Action */}
          {selectedElementId && (
            <button
              type="button"
              onClick={() => {
                const updated = elements.filter((el) => el.id !== selectedElementId);
                updateElementsState(updated);
                setSelectedElementId(null);
              }}
              className="p-2 rounded-xl border border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 cursor-pointer bg-[var(--background)]"
              title="Delete selected element"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] disabled:opacity-40 cursor-pointer bg-[var(--background)]"
            title="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] disabled:opacity-40 cursor-pointer bg-[var(--background)]"
            title="Redo"
          >
            <Redo2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)] text-[var(--foreground-muted)] cursor-pointer bg-[var(--background)]"
            title="Clear canvas"
          >
            <Trash2 size={13} />
          </button>

          <span className="w-[1px] h-6 bg-[var(--border)] mx-1" />

          {/* Invite teammate button dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setInviteOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer text-[12.5px] font-semibold transition-colors",
                inviteOpen
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-subtle)]"
              )}
            >
              <Users size={13} />
              <span>Invite</span>
            </button>

            {/* Invite dropdown menu */}
            {inviteOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-[220px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-scale-in">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-[var(--foreground-subtle)] tracking-wider">
                  Mention Teammate
                </div>
                {invitees.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSendInvite(item.id, item.displayName)}
                    className="flex items-center gap-2.5 w-full p-2 text-left rounded-lg hover:bg-[var(--background-subtle)] text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer font-medium"
                  >
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-white">
                      {item ? item.displayName.split(" ").map(w => w[0]).join("") : "?"}
                    </div>
                    <span>{item.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas workspace area */}
      <div
        ref={containerRef}
        className="flex-1 bg-[var(--background)] overflow-hidden relative"
        style={{ minHeight: "550px" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block select-none cursor-crosshair"
        />

        {/* Text Input floating field */}
        {textInput && (
          <form
            onSubmit={handleTextSubmit}
            style={{
              position: "absolute",
              left: `${textInput.x * zoom + panOffset.x}px`,
              top: `${(textInput.y - 12) * zoom + panOffset.y}px`,
            }}
            className="z-40 p-1 bg-[var(--card)] border border-[var(--primary)] rounded-lg shadow-xl"
          >
            <input
              autoFocus
              type="text"
              value={textInput.text}
              onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
              onBlur={handleTextSubmit}
              className="bg-transparent border-0 text-[14px] focus:outline-none p-1 font-medium select-text w-[200px]"
              placeholder="Enter text, press enter..."
            />
          </form>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--background-subtle)]/30 flex items-center justify-between text-[11px] text-[var(--foreground-subtle)] select-none">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[var(--foreground-muted)]">Active Tool:</span>
          <span className="capitalize px-1.5 py-0.2 rounded bg-[var(--background-muted)] text-[var(--foreground-muted)] border border-[var(--border)]">{tool}</span>
        </div>
        <div>
          <span>Click and drag to draw. Pointer tool: click to select, drag to move. Delete / Backspace: remove shape. Hand tool: drag canvas.</span>
        </div>
      </div>
    </div>
  );
}
