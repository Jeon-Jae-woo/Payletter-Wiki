import Image from '@tiptap/extension-image';

export const ImageBlockNode = Image.extend({
  name: 'imageBlock',

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' },
      align: { default: 'center' },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, align, src, alt } = HTMLAttributes;
    const img: [string, Record<string, string>] = ['img', { src: src ?? '', alt: alt ?? '', draggable: 'false' }];

    if (caption) {
      return ['figure', { class: 'image-block', 'data-align': align ?? 'center' }, img, ['figcaption', {}, caption]];
    }
    return ['figure', { class: 'image-block', 'data-align': align ?? 'center' }, img];
  },

  parseHTML() {
    return [{ tag: 'figure.image-block img' }];
  },
});
