"use client";

import React, { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

type Props = {
  value: string; // HTML
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Enter your content",
}: Props) {
  const lastExternalValueRef = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false, //

    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    // Set initial content hanya sekali dari prop value
    content: value || "<p></p>",

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class: "min-h-[220px] w-full p-3 text-sm leading-6 focus:outline-none",
      },
    },
  });

  // Sync dari luar hanya jika value "benar-benar" berubah dari external (misal load draft / reset)
  useEffect(() => {
    if (!editor) return;

    const current = editor.getHTML();
    const lastExternal = lastExternalValueRef.current;

    const isExternalUpdate = value !== current && value !== lastExternal;

    if (isExternalUpdate) {
      lastExternalValueRef.current = value;
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
        <div className="h-10 border-b border-slate-200" />
        <div className="p-3 text-sm text-slate-400">{placeholder}</div>
      </div>
    );
  }

  const isEmpty = !editor.getText().trim();

  function setLink() {
    if (!editor) return;

    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL:", prev || "");
    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "p";

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-2 py-2">
        {/* Heading dropdown */}
        <select
          className="text-sm border border-slate-200 rounded px-2 py-1 bg-white"
          value={headingValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            if (v === "h1")
              editor.chain().focus().setHeading({ level: 1 }).run();
            if (v === "h2")
              editor.chain().focus().setHeading({ level: 2 }).run();
            if (v === "h3")
              editor.chain().focus().setHeading({ level: 3 }).run();
          }}
        >
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Normal</option>
        </select>

        <Btn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Btn>
        <Btn
          active={editor.isActive("italic")}
          italic
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Btn>
        <Btn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          S
        </Btn>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Lists */}
        <Btn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Btn>
        <Btn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Btn>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Align */}
        <Btn
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          Left
        </Btn>
        <Btn
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          Center
        </Btn>
        <Btn
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          Right
        </Btn>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <Btn active={editor.isActive("link")} onClick={setLink}>
          Link
        </Btn>
        <Btn
          active={false}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          Clear
        </Btn>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent editor={editor} />
        {isEmpty && (
          <div className="pointer-events-none absolute left-3 top-3 text-sm text-slate-400">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  active,
  italic,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-sm px-2 py-1 rounded border select-none",
        active
          ? "bg-slate-100 border-slate-300"
          : "bg-white border-slate-200 hover:bg-slate-50",
        italic ? "italic" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
