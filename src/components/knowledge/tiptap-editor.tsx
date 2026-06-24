"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Mark } from "@tiptap/core";
import { useEffect, useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Undo2,
  Redo2,
  Link2,
  ChevronDown,
  Trash2,
  Highlighter,
  Plus,
  Image as ImageIcon,
  Table as TableIcon,
  RemoveFormatting,
  Minus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Custom Rich Text TextStyle Mark ──────────────────────────────────
// Manages FontSize, FontFamily, Color, and BackgroundColor in a single span mark
const CustomTextStyle = Mark.create({
  name: "textStyle",

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.fontSize) {
            return {};
          }
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
      fontFamily: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontFamily,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.fontFamily) {
            return {};
          }
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.color) {
            return {};
          }
          return { style: `color: ${attributes.color}` };
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") return {};
          if (
            element.style.fontSize ||
            element.style.fontFamily ||
            element.style.color ||
            element.style.backgroundColor
          ) {
            return {};
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    const styles: string[] = [];
    if (HTMLAttributes.fontSize) styles.push(`font-size: ${HTMLAttributes.fontSize}`);
    if (HTMLAttributes.fontFamily) styles.push(`font-family: ${HTMLAttributes.fontFamily}`);
    if (HTMLAttributes.color) styles.push(`color: ${HTMLAttributes.color}`);
    if (HTMLAttributes.backgroundColor) styles.push(`background-color: ${HTMLAttributes.backgroundColor}`);

    if (styles.length === 0) {
      return ["span", HTMLAttributes, 0];
    }

    return [
      "span",
      {
        ...HTMLAttributes,
        style: styles.join("; "),
      },
      0,
    ];
  },
});

// Custom Annotation Mark for legacy Notion-style Highlights
const AnnotationMark = Mark.create({
  name: "annotation",
  addAttributes() {
    return {
      color: {
        default: "#fef08a", // Light yellow highlight
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "mark[data-color]",
        getAttrs: (element) => {
          if (typeof element === "string") return {};
          const el = element as HTMLElement;
          return { color: el.getAttribute("data-color") };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      {
        "data-color": HTMLAttributes.color,
        style: `background-color: ${HTMLAttributes.color}; color: #1a1a1a; padding: 0.1rem 0.25rem; border-radius: 0.25rem;`,
      },
      0,
    ];
  },
});

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface SlashCommandItem {
  title: string;
  description: string;
  icon: any;
  action: (editor: any) => void;
}

export function TipTapEditor({ content, onChange, placeholder = "Type '/' for commands..." }: TipTapEditorProps) {
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    selectedIndex: number;
    query: string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    selectedIndex: 0,
    query: "",
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const slashMenuRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      CustomTextStyle,
      AnnotationMark,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[var(--primary)] hover:underline cursor-pointer font-medium",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-[var(--border)] w-full my-4 rounded-lg overflow-hidden",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-[var(--border)]",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border-r border-[var(--border)] p-2.5 text-[13px] min-w-[60px] align-top relative bg-[var(--card)]",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border-r border-[var(--border)] bg-[var(--background-muted)] font-semibold p-2.5 text-[13px] text-left align-top",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-xl max-w-full my-4 border border-[var(--border)] shadow-md hover:shadow-lg transition-all",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "list-none p-0 my-3 space-y-2",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      
      // Handle Slash commands detection
      const { selection } = editor.state;
      const textBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 20), selection.from, "\n");
      const match = textBefore.match(/\/(\w*)$/);
      
      if (match) {
        const query = match[1];
        try {
          const coords = editor.view.coordsAtPos(selection.from);
          setSlashMenu((prev) => ({
            isOpen: true,
            x: coords.left,
            y: coords.bottom + window.scrollY + 5,
            selectedIndex: prev.isOpen && prev.query === query ? prev.selectedIndex : 0,
            query,
          }));
        } catch (e) {
          // View might not be rendered yet
        }
      } else {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Close slash menu on arrow click/move selection without typing
      const { selection } = editor.state;
      const textBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 20), selection.from, "\n");
      if (!textBefore.includes("/")) {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6 text-[15px] leading-relaxed text-[var(--foreground)]",
      },
      handleKeyDown: (view, event) => {
        if (slashMenu.isOpen) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashMenu((prev) => ({
              ...prev,
              selectedIndex: (prev.selectedIndex + 1) % filteredCommands.length,
            }));
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashMenu((prev) => ({
              ...prev,
              selectedIndex: (prev.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length,
            }));
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const cmd = filteredCommands[slashMenu.selectedIndex];
            if (cmd) {
              const { selection } = view.state;
              const rangeFrom = selection.from - slashMenu.query.length - 1;
              editor.commands.deleteRange({ from: rangeFrom, to: selection.from });
              cmd.action(editor);
            }
            setSlashMenu((prev) => ({ ...prev, isOpen: false }));
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setSlashMenu((prev) => ({ ...prev, isOpen: false }));
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync content updates
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Click outside to close slash and toolbar dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  // Toggle toolbar dropdowns
  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  // Typography Options Configuration
  const fonts = [
    { name: "Default (Outfit)", value: "Outfit, sans-serif" },
    { name: "Inter", value: "Inter, sans-serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Playfair Display", value: "Playfair Display, serif" },
    { name: "Courier New", value: "Courier New, monospace" },
    { name: "Comic Sans", value: "Comic Sans MS, cursive" },
  ];

  const sizes = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px"];

  const textColors = [
    { name: "Charcoal", hex: "#1e293b" },
    { name: "Slate", hex: "#64748b" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Purple", hex: "#a855f7" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Orange", hex: "#f97316" },
    { name: "Amber", hex: "#d97706" },
  ];

  const highlightColors = [
    { name: "Clear", hex: "transparent" },
    { name: "Yellow", hex: "rgba(253, 224, 71, 0.4)" },
    { name: "Green", hex: "rgba(187, 247, 208, 0.4)" },
    { name: "Blue", hex: "rgba(191, 219, 254, 0.4)" },
    { name: "Pink", hex: "rgba(251, 207, 232, 0.4)" },
    { name: "Orange", hex: "rgba(254, 215, 170, 0.4)" },
  ];

  // Helper Set Commands
  const setFontFamily = (family: string) => {
    const attrs = editor.getAttributes("textStyle");
    editor.chain().focus().setMark("textStyle", { ...attrs, fontFamily: family }).run();
  };

  const setFontSize = (size: string) => {
    const attrs = editor.getAttributes("textStyle");
    editor.chain().focus().setMark("textStyle", { ...attrs, fontSize: size }).run();
  };

  const setTextColor = (color: string) => {
    const attrs = editor.getAttributes("textStyle");
    editor.chain().focus().setMark("textStyle", { ...attrs, color }).run();
  };

  const setHighlightColor = (bgColor: string) => {
    const attrs = editor.getAttributes("textStyle");
    const newBg = bgColor === "transparent" ? null : bgColor;
    editor.chain().focus().setMark("textStyle", { ...attrs, backgroundColor: newBg }).run();
  };

  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().unsetMark("textStyle").run();
  };

  const addImage = (urlStr?: string) => {
    const url = urlStr || window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Get current active styling attributes for display
  const textStyleAttrs = editor.getAttributes("textStyle");
  const activeFont = textStyleAttrs.fontFamily || "Outfit, sans-serif";
  const activeSize = textStyleAttrs.fontSize || "14px";
  const activeColor = textStyleAttrs.color || "#1e293b";
  const activeBgColor = textStyleAttrs.backgroundColor || "transparent";

  // Find readable font display name
  const currentFontObj = fonts.find((f) => activeFont.startsWith(f.value.split(",")[0])) || fonts[0];
  const currentFontName = currentFontObj.name.replace("Default (", "").replace(")", "");

  // Define Slash Commands List
  const slashCommands: SlashCommandItem[] = [
    {
      title: "Heading 1",
      description: "Big section heading",
      icon: Heading1Icon,
      action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: Heading2Icon,
      action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: Heading3Icon,
      action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Bullet List",
      description: "Simple bulleted list",
      icon: List,
      action: (ed) => ed.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Sequential list",
      icon: ListOrdered,
      action: (ed) => ed.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Checklist",
      description: "Interactive task checklist",
      icon: CheckSquare,
      action: (ed) => ed.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Quote",
      description: "Large blockquote block",
      icon: QuoteIcon,
      action: (ed) => ed.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Code Block",
      description: "Syntax highlighted code snippet",
      icon: Code,
      action: (ed) => ed.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Table",
      description: "Insert a 3x3 table grid",
      icon: TableIcon,
      action: (ed) => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "Image",
      description: "Embed an external image link",
      icon: ImageIcon,
      action: (ed) => addImage(),
    },
    {
      title: "Divider",
      description: "Horizontal section break rule",
      icon: Plus,
      action: (ed) => ed.chain().focus().setHorizontalRule().run(),
    },
  ];

  // Helper icons for slash command definitions
  function Heading1Icon({ size, className }: { size?: number; className?: string }) {
    return <div className={cn("text-[11px] font-extrabold select-none", className)}>H1</div>;
  }
  function Heading2Icon({ size, className }: { size?: number; className?: string }) {
    return <div className={cn("text-[11px] font-extrabold select-none", className)}>H2</div>;
  }
  function Heading3Icon({ size, className }: { size?: number; className?: string }) {
    return <div className={cn("text-[11px] font-extrabold select-none", className)}>H3</div>;
  }
  function QuoteIcon({ size, className }: { size?: number; className?: string }) {
    return <div className={cn("text-[14px] font-serif italic font-bold select-none", className)}>“</div>;
  }

  const filteredCommands = slashCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  const isTableActive = editor.isActive("table");

  return (
    <div className="relative w-full">
      {/* Floating Formatting Bubble Menu (Notion style) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-1 z-40 animate-scale-in"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
              editor.isActive("bold") && "text-[var(--primary)] bg-[var(--background-muted)]"
            )}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
              editor.isActive("italic") && "text-[var(--primary)] bg-[var(--background-muted)]"
            )}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
              editor.isActive("underline") && "text-[var(--primary)] bg-[var(--background-muted)]"
            )}
            title="Underline"
          >
            <UnderlineIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
              editor.isActive("strike") && "text-[var(--primary)] bg-[var(--background-muted)]"
            )}
            title="Strike-through"
          >
            <Strikethrough size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
              editor.isActive("code") && "text-[var(--primary)] bg-[var(--background-muted)]"
            )}
            title="Inline Code"
          >
            <Code size={13} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Link button */}
          <button
            type="button"
            onClick={addLink}
            className={cn(
              "p-1.5 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
              editor.isActive("link") && "text-[var(--primary)] bg-[var(--background-muted)]"
            )}
            title="Link"
          >
            <Link2 size={13} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Highlight Color Pickers */}
          <div className="flex items-center gap-1 px-1">
            {highlightColors.map((hc) => (
              <button
                key={hc.name}
                type="button"
                onClick={() => setHighlightColor(hc.hex)}
                style={{
                  backgroundColor: hc.hex === "transparent" ? "transparent" : hc.hex,
                  borderColor: hc.hex === "transparent" ? "var(--border)" : "transparent",
                }}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all text-[8px] font-bold text-slate-700",
                  hc.hex === "transparent" && "border-[var(--border)]"
                )}
                title={hc.name === "Clear" ? "Clear highlight" : `${hc.name} highlight`}
              >
                {hc.name === "Clear" && "×"}
              </button>
            ))}
          </div>
        </BubbleMenu>
      )}

      {/* Floating Slash Commands Menu */}
      {slashMenu.isOpen && filteredCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          style={{
            position: "fixed",
            left: `${slashMenu.x}px`,
            top: `${slashMenu.y}px`,
          }}
          className="w-[260px] max-h-[300px] overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-55 flex flex-col gap-0.5 animate-scale-in"
        >
          <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[var(--foreground-subtle)] tracking-wider">
            Blocks
          </div>
          {filteredCommands.map((cmd, idx) => {
            const CmdIcon = cmd.icon;
            return (
              <button
                key={cmd.title}
                type="button"
                onClick={() => {
                  const { selection } = editor.state;
                  const rangeFrom = selection.from - slashMenu.query.length - 1;
                  editor.commands.deleteRange({ from: rangeFrom, to: selection.from });
                  cmd.action(editor);
                  setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full p-2 text-left rounded-lg text-[13.5px] cursor-pointer transition-colors",
                  idx === slashMenu.selectedIndex
                    ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-medium"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)]"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--border)]",
                  idx === slashMenu.selectedIndex ? "bg-[var(--card)]" : "bg-[var(--background-subtle)]"
                )}>
                  <CmdIcon size={14} className={idx === slashMenu.selectedIndex ? "text-[var(--primary)]" : "text-[var(--foreground-muted)]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] leading-none">{cmd.title}</div>
                  <div className="text-[10px] text-[var(--foreground-subtle)] truncate mt-1 leading-none">{cmd.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Editor Main Container (Distraction-Free Styling) */}
      <div className="bg-transparent prose-headings:font-bold prose-p:text-[var(--foreground-muted)]">
        
        {/* Word-style Top Toolbar */}
        <div ref={toolbarRef} className="relative z-30 flex flex-wrap items-center gap-1 p-2 bg-[var(--background-subtle)]/70 border border-[var(--border)] rounded-xl mb-4 text-[12px] select-none">
          
          {/* History Group */}
          <div className="flex items-center gap-0.5">
            <button
              key="undo-btn"
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-lg hover:bg-[var(--background-muted)] disabled:opacity-40 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
              title="Undo"
            >
              <Undo2 size={13} />
            </button>
            <button
              key="redo-btn"
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-lg hover:bg-[var(--background-muted)] disabled:opacity-40 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
              title="Redo"
            >
              <Redo2 size={13} />
            </button>
          </div>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Font & Size Dropdowns */}
          <div className="flex items-center gap-1">
            {/* Font Family Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("font")}
                className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background-subtle)] text-[12px] font-semibold text-[var(--foreground-muted)] bg-[var(--card)] cursor-pointer min-w-[120px] text-left"
              >
                <span className="truncate">{currentFontName}</span>
                <ChevronDown size={11} className="opacity-60 flex-shrink-0" />
              </button>

              {activeDropdown === "font" && (
                <div className="absolute left-0 top-[calc(100%+4px)] w-[180px] max-h-[250px] overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-40 flex flex-col gap-0.5 animate-scale-in">
                  {fonts.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => {
                        setFontFamily(f.value);
                        setActiveDropdown(null);
                      }}
                      style={{ fontFamily: f.value }}
                      className={cn(
                        "w-full px-2.5 py-1.5 text-left rounded-lg text-[13px] hover:bg-[var(--background-subtle)] cursor-pointer transition-colors",
                        activeFont.startsWith(f.value.split(",")[0])
                          ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-bold"
                          : "text-[var(--foreground-muted)]"
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("size")}
                className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background-subtle)] text-[12px] font-semibold text-[var(--foreground-muted)] bg-[var(--card)] cursor-pointer min-w-[60px] text-left"
              >
                <span>{activeSize}</span>
                <ChevronDown size={11} className="opacity-60 flex-shrink-0" />
              </button>

              {activeDropdown === "size" && (
                <div className="absolute left-0 top-[calc(100%+4px)] w-[80px] max-h-[250px] overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-40 flex flex-col gap-0.5 animate-scale-in">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setFontSize(s);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        "w-full px-2.5 py-1 text-center rounded-lg text-[13px] hover:bg-[var(--background-subtle)] cursor-pointer font-mono transition-colors",
                        activeSize === s
                          ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-bold"
                          : "text-[var(--foreground-muted)]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Typography Styles Group */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
                editor.isActive("bold") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Bold"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
                editor.isActive("italic") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Italic"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
                editor.isActive("underline") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Underline"
            >
              <UnderlineIcon size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
                editor.isActive("strike") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Strike-through"
            >
              <Strikethrough size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer",
                editor.isActive("code") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Inline Code"
            >
              <Code size={13} />
            </button>
            <button
              type="button"
              onClick={clearFormatting}
              className="p-1.5 rounded-lg hover:bg-[var(--background-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              title="Clear Formatting"
            >
              <RemoveFormatting size={13} />
            </button>
          </div>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Color pickers Group */}
          <div className="flex items-center gap-1">
            {/* Text Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("color")}
                className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-[var(--background-subtle)] border border-[var(--border)] text-[var(--foreground-muted)] bg-[var(--card)] cursor-pointer"
                title="Text Color"
              >
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="font-bold text-[12px] font-serif">A</span>
                  <div style={{ backgroundColor: activeColor }} className="w-3.5 h-0.5 mt-0.5 rounded-full" />
                </div>
                <ChevronDown size={8} className="opacity-60 flex-shrink-0" />
              </button>

              {activeDropdown === "color" && (
                <div className="absolute left-0 top-[calc(100%+4px)] w-[120px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-40 grid grid-cols-4 gap-1 animate-scale-in">
                  {textColors.map((tc) => (
                    <button
                      key={tc.hex}
                      type="button"
                      onClick={() => {
                        setTextColor(tc.hex);
                        setActiveDropdown(null);
                      }}
                      style={{ backgroundColor: tc.hex }}
                      className={cn(
                        "w-5 h-5 rounded-md border border-black/10 cursor-pointer transition-transform hover:scale-115 flex items-center justify-center",
                        activeColor === tc.hex && "ring-2 ring-[var(--primary)] ring-offset-1"
                      )}
                      title={tc.name}
                    >
                      {activeColor === tc.hex && <Check size={8} className="text-white mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Highlight Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("highlight")}
                className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-[var(--background-subtle)] border border-[var(--border)] text-[var(--foreground-muted)] bg-[var(--card)] cursor-pointer"
                title="Highlight Color"
              >
                <div className="flex flex-col items-center justify-center leading-none relative">
                  <Highlighter size={13} className="text-[var(--foreground-muted)]" />
                  <div style={{ backgroundColor: activeBgColor === "transparent" ? "var(--border)" : activeBgColor }} className="w-3.5 h-0.5 mt-0.5 rounded-full absolute bottom-[-4px]" />
                </div>
                <ChevronDown size={8} className="opacity-60 flex-shrink-0 ml-1.5" />
              </button>

              {activeDropdown === "highlight" && (
                <div className="absolute left-0 top-[calc(100%+4px)] w-[120px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-40 grid grid-cols-3 gap-1 animate-scale-in">
                  {highlightColors.map((hc) => (
                    <button
                      key={hc.name}
                      type="button"
                      onClick={() => {
                        setHighlightColor(hc.hex);
                        setActiveDropdown(null);
                      }}
                      style={{ backgroundColor: hc.hex === "transparent" ? "transparent" : hc.hex }}
                      className={cn(
                        "w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-transform hover:scale-115 text-[9px] font-bold text-slate-700",
                        hc.hex === "transparent" && "border-slate-300 bg-linear-to-tr from-transparent via-red-300 to-transparent",
                        activeBgColor === hc.hex && "ring-2 ring-[var(--primary)] ring-offset-1"
                      )}
                      title={hc.name}
                    >
                      {hc.name === "Clear" ? "×" : activeBgColor === hc.hex && <Check size={8} className="text-slate-800 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Alignments Group */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive({ textAlign: "left" }) && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive({ textAlign: "center" }) && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive({ textAlign: "right" }) && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive({ textAlign: "justify" }) && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Justify Alignment"
            >
              <AlignJustify size={13} />
            </button>
          </div>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Lists Group */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive("bulletList") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Bullet List"
            >
              <List size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive("orderedList") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Numbered List"
            >
              <ListOrdered size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive("taskList") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Task Checklist"
            >
              <CheckSquare size={13} />
            </button>
          </div>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1" />

          {/* Insertions Group */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={addLink}
              className={cn(
                "p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                editor.isActive("link") && "text-[var(--primary)] bg-[var(--background-muted)]"
              )}
              title="Insert Link"
            >
              <Link2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => addImage()}
              className="p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              title="Embed Image"
            >
              <ImageIcon size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              title="Insert Table"
            >
              <TableIcon size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded-lg hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              title="Insert Horizontal Line"
            >
              <Minus size={13} />
            </button>
          </div>
          
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--foreground-subtle)] italic select-none">
              Type <strong className="font-bold">/</strong> for commands
            </span>
          </div>
        </div>

        {/* Table Operations context toolbar */}
        {isTableActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-[var(--primary-subtle)] rounded-xl bg-indigo-50/10 dark:bg-indigo-950/10 text-[11px] text-[var(--primary)] mb-3 flex-wrap animate-scale-in">
            <span className="font-bold uppercase tracking-wider text-[9px] bg-[var(--primary-subtle)] px-1 rounded">Table</span>
            <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="hover:underline cursor-pointer">+ Col L</button>
            <span>|</span>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="hover:underline cursor-pointer">+ Col R</button>
            <span>|</span>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="text-[var(--danger)] hover:underline cursor-pointer">- Col</button>
            <span>|</span>
            <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="hover:underline cursor-pointer">+ Row A</button>
            <span>|</span>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="hover:underline cursor-pointer">+ Row B</button>
            <span>|</span>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="text-[var(--danger)] hover:underline cursor-pointer">- Row</button>
            <span>|</span>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="text-[var(--danger)] font-semibold hover:underline cursor-pointer ml-auto">Delete Table</button>
          </div>
        )}

        {/* Actual Editor Content */}
        <div className="border border-transparent bg-transparent outline-none">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
