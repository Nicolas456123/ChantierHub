"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
  content: string; // JSON string or HTML
  onChange: (json: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  autosaveDelay?: number;
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Commencez à écrire...",
  className = "",
  autosaveDelay = 1500,
}: TiptapEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedSave = useCallback(
    (json: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeRef.current(json);
      }, autosaveDelay);
    },
    [autosaveDelay]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: parseContent(content),
    editable,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      debouncedSave(json);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2",
      },
    },
  });

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div
      className={`rounded-md border bg-background ${
        editable ? "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" : ""
      } ${className}`}
    >
      {editable && (
        <div className="flex items-center gap-0.5 border-b px-2 py-1.5 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Gras"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italique"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Souligné"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="Titre H2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title="Titre H3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Liste à puces"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Liste numérotée"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-7 w-7 ${active ? "bg-accent text-accent-foreground" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

function parseContent(content: string): Record<string, unknown> | string {
  if (!content || content === "{}" || content === '""') {
    return "";
  }
  try {
    const parsed = JSON.parse(content);
    // If it's a Tiptap JSON doc, return it
    if (parsed.type === "doc") return parsed;
    // If it has a text field (our legacy format), return as text
    if (parsed.text) return parsed.text;
    return "";
  } catch {
    // Plain text
    return content;
  }
}
