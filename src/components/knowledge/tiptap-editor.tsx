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
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Table as TableIcon,
  Image as ImageIcon,
  CheckSquare,
  Undo2,
  Redo2,
  Link2,
  Sparkles,
  ChevronDown,
  Trash2,
  Highlighter,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Annotation Mark for Notion-style Highlights
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

  const slashMenuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
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
          // Calculate relative offsets to center it nicely
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
              // Delete the "/" command trigger
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

  // Click outside to close slash menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

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

  const setAnnotationColor = (color: string) => {
    if (color === "clear") {
      editor.chain().focus().unsetMark("annotation").run();
    } else {
      editor.chain().focus().setMark("annotation", { color }).run();
    }
  };

  // Define Slash Commands List
  const slashCommands: SlashCommandItem[] = [
    {
      title: "Heading 1",
      description: "Big section heading",
      icon: Heading1,
      action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: Heading3,
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
      icon: Quote,
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

  const filteredCommands = slashCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  const isTableActive = editor.isActive("table");

  // Highlight colors configuration
  const HIGHLIGHT_COLORS = [
    { name: "Yellow", color: "#fef08a" },
    { name: "Green", color: "#bbf7d0" },
    { name: "Blue", color: "#bfdbfe" },
    { name: "Pink", color: "#fbcfe8" },
    { name: "Clear", color: "clear" },
  ];

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
            {HIGHLIGHT_COLORS.map((hc) => (
              <button
                key={hc.name}
                type="button"
                onClick={() => setAnnotationColor(hc.color)}
                style={{
                  backgroundColor: hc.color === "clear" ? "transparent" : hc.color,
                  borderColor: hc.color === "clear" ? "var(--border)" : "transparent",
                }}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all text-[8px] font-bold text-slate-700",
                  hc.color === "clear" && "border-[var(--border)]"
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
        {/* Sub-toolbar for standard controls like Undo/Redo & Alignments */}
        <div className="flex items-center justify-between gap-1 py-1.5 px-3 border-b border-[var(--border)] bg-[var(--background-subtle)]/30 rounded-xl mb-4 text-[12px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1 rounded hover:bg-[var(--background-muted)] disabled:opacity-40 text-[var(--foreground-subtle)] cursor-pointer"
              title="Undo"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1 rounded hover:bg-[var(--background-muted)] disabled:opacity-40 text-[var(--foreground-subtle)] cursor-pointer"
              title="Redo"
            >
              <Redo2 size={13} />
            </button>
            
            <span className="w-[1px] h-3.5 bg-[var(--border)] mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={cn("p-1 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-subtle)]", editor.isActive({ textAlign: "left" }) && "text-[var(--primary)] bg-[var(--background-muted)]")}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={cn("p-1 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-subtle)]", editor.isActive({ textAlign: "center" }) && "text-[var(--primary)] bg-[var(--background-muted)]")}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={cn("p-1 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-subtle)]", editor.isActive({ textAlign: "right" }) && "text-[var(--primary)] bg-[var(--background-muted)]")}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--foreground-subtle)] italic select-none">
              Type <strong className="font-bold">/</strong> for blocks
            </span>
          </div>
        </div>

        {/* Table Operations context toolbar */}
        {isTableActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-[var(--primary-subtle)] rounded-xl bg-indigo-50/10 dark:bg-indigo-950/10 text-[11px] text-[var(--primary)] mb-3 flex-wrap">
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
