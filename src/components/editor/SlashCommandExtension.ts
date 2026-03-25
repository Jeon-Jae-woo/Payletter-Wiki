'use client';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import SlashCommandMenu from './SlashCommandMenu';
import type { Editor } from '@tiptap/core';
import type { Range } from '@tiptap/core';

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: string;
  command: (args: { editor: Editor; range: Range }) => void;
};

// The 7 slash command items
export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: '제목 1',
    description: '대형 섹션 제목',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: '제목 2',
    description: '중형 섹션 제목',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: '제목 3',
    description: '소형 섹션 제목',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: '글머리 기호',
    description: '순서 없는 목록',
    icon: '•—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: '번호 목록',
    description: '순서 있는 목록',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: '인용구',
    description: '인용 블록',
    icon: '❝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: '구분선',
    description: '수평 구분선',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: '할 일 목록',
    description: '체크박스 할 일 목록',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: '페이지 링크',
    description: '다른 페이지를 인라인으로 연결',
    icon: '🔗',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(new CustomEvent('open-page-link-search'));
    },
  },
];

const SlashCommandExtension = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return SLASH_COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          let component: ReactRenderer;
          let popup: TippyInstance[];
          return {
            onStart: (props: SuggestionProps<SlashCommandItem>) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });
              popup = [tippy(document.body, {
                getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })];
            },
            onUpdate(props: SuggestionProps<SlashCommandItem>) {
              component.updateProps(props);
              if (!props.clientRect) return;
              popup[0].setProps({ getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect() });
            },
            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              return (component.ref as { onKeyDown?: (p: SuggestionKeyDownProps) => boolean } | null)?.onKeyDown?.(props) ?? false;
            },
            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommandExtension;
