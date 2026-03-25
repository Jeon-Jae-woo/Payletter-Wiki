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
    const figure = ['figure', { class: 'image-block', 'data-align': align ?? 'center' }];
    const img = ['img', { src, alt: alt ?? '', draggable: 'false' }];

    if (caption) {
      return [...figure, img, ['figcaption', {}, caption]] as unknown as [string, ...unknown[]];
    }
    return [...figure, img] as unknown as [string, ...unknown[]];
  },

  parseHTML() {
    return [{ tag: 'figure.image-block > img' }];
  },
});
