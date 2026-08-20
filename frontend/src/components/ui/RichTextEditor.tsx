"use client";

import { PaperClipIcon } from "@heroicons/react/24/outline";
import { useEffect, useId } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onAttach?: (file: File) => void | Promise<void>;
  isUploadingAttachment?: boolean;
};

type ToolbarButtonProps = {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({
  label,
  title,
  active,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Inclua orientações ou detalhes importantes.",
  disabled = false,
  onAttach,
  isUploadingAttachment = false,
}: RichTextEditorProps) {
  const attachmentInputId = useId();
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-36 w-full px-4 py-3 text-sm leading-6 text-slate-800 outline-none dark:text-slate-100",
      },
    },
  });
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isBold: currentEditor?.isActive("bold") ?? false,
      isItalic: currentEditor?.isActive("italic") ?? false,
      isUnderline: currentEditor?.isActive("underline") ?? false,
      isBulletList: currentEditor?.isActive("bulletList") ?? false,
      isOrderedList: currentEditor?.isActive("orderedList") ?? false,
    }),
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-36 animate-pulse bg-slate-50 dark:bg-slate-800/60" />
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "Cole o endereço do link",
      previousUrl ?? "https://",
    );
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-primary-900/30">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/70">
        <ToolbarButton
          label="B"
          title="Negrito"
          active={editorState?.isBold}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          title="Itálico"
          active={editorState?.isItalic}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="U"
          title="Sublinhado"
          active={editorState?.isUnderline}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        {onAttach ? (
          <label
            htmlFor={attachmentInputId}
            title="Anexar PDF"
            aria-label="Anexar PDF"
            className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-slate-600 transition-colors hover:bg-slate-100 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <PaperClipIcon className="h-4 w-4" />
            <input
              id={attachmentInputId}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={disabled || isUploadingAttachment}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (file) void onAttach(file);
              }}
            />
          </label>
        ) : null}
        <span
          className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700"
          aria-hidden="true"
        />
        <ToolbarButton
          label="🔗"
          title="Inserir link"
          disabled={disabled}
          onClick={setLink}
        />
        <span
          className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700"
          aria-hidden="true"
        />
        <ToolbarButton
          label="≡"
          title="Alinhar à esquerda"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <ToolbarButton
          label="≣"
          title="Centralizar"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <ToolbarButton
          label="≡"
          title="Alinhar à direita"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />
        <span
          className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700"
          aria-hidden="true"
        />
        <ToolbarButton
          label="• List"
          title="Lista com marcadores"
          active={editorState?.isBulletList}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. List"
          title="Lista numerada"
          active={editorState?.isOrderedList}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
