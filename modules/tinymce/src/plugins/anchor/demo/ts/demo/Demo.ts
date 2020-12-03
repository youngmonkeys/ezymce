declare let tinymce: any;

tinymce.init({
  selector: 'textarea.tinymce',
  // plugins: 'anchor code',
  // toolbar: 'anchor code',
  height: 600,
  setup(ed) {
    ed.on('NodeChange', (e) => {
      console.log('node change');
      console.log(e);
    });
  },
});

export {};
