"use client";

import { useEditor, EditorContent } from "@tiptap/react";
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
import { useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ content, onChange, placeholder = "Start typing..." }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[var(--primary)] hover:underline cursor-pointer",
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
          class: "border-collapse border border-[var(--border)] w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-[var(--border)]",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border-r border-[var(--border)] p-2 text-[13px] min-w-[50px] align-top relative",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border-r border-[var(--border)] bg-[var(--background-muted)] font-semibold p-2 text-[13px] text-left align-top",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-4 border border-[var(--border)] shadow-sm",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "list-none p-0 my-3 space-y-1.5",
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
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[350px] p-4 text-[14px] leading-relaxed text-[var(--foreground)]",
      },
    },
  });

  // Sync content updates
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
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

  const isTableActive = editor.isActive("table");

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)] flex flex-col focus-within:border-[var(--border-strong)] transition-all shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--background-subtle)] flex-wrap">
        {/* History */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-[var(--background-muted)] disabled:opacity-40 text-[var(--foreground-muted)] cursor-pointer"
          title="Undo"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-[var(--background-muted)] disabled:opacity-40 text-[var(--foreground-muted)] cursor-pointer"
          title="Redo"
        >
          <Redo2 size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("heading", { level: 1 }) && "bg-[var(--background-muted)] text-[var(--primary)] font-semibold"
          )}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("heading", { level: 2 }) && "bg-[var(--background-muted)] text-[var(--primary)] font-semibold"
          )}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("heading", { level: 3 }) && "bg-[var(--background-muted)] text-[var(--primary)] font-semibold"
          )}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        {/* Format Marks */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("bold") && "bg-[var(--background-muted)] text-[var(--primary)] font-semibold"
          )}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("italic") && "bg-[var(--background-muted)] text-[var(--primary)] font-semibold"
          )}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("underline") && "bg-[var(--background-muted)] text-[var(--primary)] font-semibold"
          )}
          title="Underline"
        >
          <UnderlineIcon size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive({ textAlign: "left" }) && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive({ textAlign: "center" }) && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive({ textAlign: "right" }) && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        {/* Lists & Callouts */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("bulletList") && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("orderedList") && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("taskList") && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Checklist"
        >
          <CheckSquare size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        {/* Nodes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("blockquote") && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Quote / Callout"
        >
          <Quote size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("codeBlock") && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Code Block"
        >
          <Code size={14} />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        {/* Media / Links */}
        <button
          type="button"
          onClick={addLink}
          className={cn(
            "p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]",
            editor.isActive("link") && "bg-[var(--background-muted)] text-[var(--primary)]"
          )}
          title="Insert Link"
        >
          <Link2 size={14} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]"
          title="Insert Image"
        >
          <ImageIcon size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-1.5 rounded hover:bg-[var(--background-muted)] cursor-pointer text-[var(--foreground-muted)]"
          title="Insert Table"
        >
          <TableIcon size={14} />
        </button>
      </div>

      {/* Table Context Operations Toolbar */}
      {isTableActive && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[var(--border)] bg-indigo-50/50 dark:bg-indigo-950/20 text-[11px] text-[var(--primary)] flex-wrap font-medium">
          <span className="text-[var(--foreground-muted)] mr-1">Table:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="hover:underline cursor-pointer"
          >
            + Col Left
          </button>
          <span className="opacity-40">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="hover:underline cursor-pointer"
          >
            + Col Right
          </button>
          <span className="opacity-40">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="text-[var(--danger)] hover:underline cursor-pointer"
          >
            - Col
          </button>
          <span className="opacity-40">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="hover:underline cursor-pointer"
          >
            + Row Above
          </button>
          <span className="opacity-40">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="hover:underline cursor-pointer"
          >
            + Row Below
          </button>
          <span className="opacity-40">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="text-[var(--danger)] hover:underline cursor-pointer"
          >
            - Row
          </button>
          <span className="opacity-40">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="text-[var(--danger)] font-bold hover:underline cursor-pointer ml-auto"
          >
            Delete Table
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 min-h-[350px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
