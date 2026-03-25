import { Node, mergeAttributes } from '@tiptap/core';

export const PageLinkNode = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      title: { default: '' },
      icon: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-page-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-page-link': '' }, HTMLAttributes),
      `${HTMLAttributes.icon ?? '📄'} ${HTMLAttributes.title ?? '제목 없음'}`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('a');
      dom.setAttribute('data-page-link', node.attrs.id);
      dom.href = `/documents/${node.attrs.id}`;
      dom.target = '_blank';
      dom.rel = 'noopener noreferrer';
      dom.className =
        'inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 text-[#0054FF] text-[0.875em] no-underline hover:bg-blue-100 transition-colors cursor-pointer select-none';
      dom.contentEditable = 'false';

      const iconSpan = document.createElement('span');
      iconSpan.textContent = node.attrs.icon ?? '📄';
      iconSpan.style.fontSize = '0.9em';

      const titleSpan = document.createElement('span');
      titleSpan.textContent = node.attrs.title || '제목 없음';

      dom.appendChild(iconSpan);
      dom.appendChild(titleSpan);

      return { dom };
    };
  },
});
