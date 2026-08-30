'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Editor } from '@ckeditor/ckeditor5-core';

interface CKEditorFileLoader {
  file: Promise<File>;
}

type CKEditorConstructor = {
  create: (...args: unknown[]) => Promise<Editor>;
  EditorWatchdog: unknown;
  ContextWatchdog: unknown;
};

const ensureFileLoader = (loader: unknown): CKEditorFileLoader => {
  if (!loader || typeof (loader as CKEditorFileLoader).file === 'undefined') {
    throw new Error('Invalid CKEditor file loader');
  }
  return loader as CKEditorFileLoader;
};

type EditorWithExtras = Editor & {
  getData: () => string;
  ui: {
    view: {
      editable: { element: HTMLElement | null };
      toolbar: { element: HTMLElement | null };
    };
  };
};

const CKEditor = dynamic(
  () =>
    import('@ckeditor/ckeditor5-react').then((mod) => ({
      default: mod.CKEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
        <div className="text-gray-500 dark:text-gray-400">در حال بارگذاری ویرایشگر...</div>
      </div>
    ),
  }
);

let ClassicEditor: CKEditorConstructor | null = null;

interface BaseEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  imageUpload?: boolean;
  className?: string;
  rtl?: boolean;
}

const getResponsiveHeight = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? 200 : 400;
  }
  return 400;
};

const getEditorThemeColors = (isDark: boolean) => ({
  editableBg: isDark ? '#1f2937' : '#ffffff',
  editableColor: isDark ? '#f3f4f6' : '#000000',
  editableBorder: isDark ? '#4b5563' : '#c4c4c4',
  mainBg: isDark ? '#1f2937' : '#ffffff',
  toolbarBg: isDark ? '#374151' : '#f8f9fa',
  toolbarBorder: isDark ? '#4b5563' : '#c4c4c4',
  buttonColor: isDark ? '#f3f4f6' : '#000000',
  buttonHoverBg: isDark ? '#4b5563' : '#e5e7eb',
  buttonOnBg: isDark ? '#6b7280' : '#d1d5db',
});

export function BaseEditor({
  value,
  onChange,
  placeholder = 'متن خود را بنویسید...',
  imageUpload = false,
  className = '',
  rtl = true,
}: BaseEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const editorRef = useRef<EditorWithExtras | null>(null);

  const applyEditorTheme = useCallback((editor: EditorWithExtras, dark: boolean) => {
    const colors = getEditorThemeColors(dark);
    const editableElement = editor.ui.view.editable.element;
    const toolbarElement = editor.ui.view.toolbar.element;
    const editorRoot = editableElement?.closest('.ck-editor') as HTMLElement | null;

    if (editorRoot) {
      editorRoot.style.setProperty('--ck-color-base-background', colors.editableBg);
      editorRoot.style.setProperty('--ck-color-text', colors.editableColor);
      editorRoot.style.setProperty('--ck-color-toolbar-background', colors.toolbarBg);
      editorRoot.style.setProperty('--ck-color-toolbar-border', colors.toolbarBorder);
    }

    if (editableElement) {
      editableElement.style.backgroundColor = colors.editableBg;
      editableElement.style.color = colors.editableColor;
      editableElement.style.borderColor = colors.editableBorder;
      editableElement.style.caretColor = colors.editableColor;
    }

    if (toolbarElement) {
      toolbarElement.style.backgroundColor = colors.toolbarBg;
      toolbarElement.style.borderColor = colors.toolbarBorder;
    }
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      applyEditorTheme(editorRef.current, isDark);
    }
  }, [isDark, applyEditorTheme]);

  class Base64UploadAdapter {
    loader: CKEditorFileLoader;
    constructor(loader: CKEditorFileLoader) {
      this.loader = loader;
    }
    upload() {
      return this.loader.file.then(
        (file: File) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve({ default: reader.result }));
            reader.addEventListener('error', () => reject(reader.error));
            reader.readAsDataURL(file);
          })
      );
    }
    abort() {}
  }

  function uploadPlugin(editor: Editor) {
    const fileRepository = editor.plugins.get('FileRepository') as unknown as {
      createUploadAdapter: (loader: unknown) => unknown;
    };
    fileRepository.createUploadAdapter = (loader: unknown) => new Base64UploadAdapter(ensureFileLoader(loader));
  }

  const colors = getEditorThemeColors(isDark);
  const editorHeight = getResponsiveHeight();

  const editorConfiguration: Record<string, unknown> = {
    placeholder,
    extraPlugins: imageUpload ? [uploadPlugin] : [],
    language: rtl ? 'fa' : 'en',
    direction: rtl ? 'rtl' : 'ltr',
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'fontSize',
      'fontFamily',
      '|',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'outdent',
      'indent',
      '|',
      'alignment',
      '|',
      'link',
      'blockQuote',
      'insertTable',
      '|',
      ...(imageUpload ? ['imageUpload'] : []),
      '|',
      'undo',
      'redo',
    ],
    styles: `
      .ck-editor__editable {
        background-color: ${colors.editableBg} !important;
        color: ${colors.editableColor} !important;
        border: 1px solid ${colors.editableBorder} !important;
        resize: none !important;
        overflow: auto !important;
        min-height: ${editorHeight}px !important;
        height: ${editorHeight}px !important;
      }
      .ck-editor__main {
        background-color: ${colors.mainBg} !important;
      }
      .ck-toolbar {
        background-color: ${colors.toolbarBg} !important;
        border: 1px solid ${colors.toolbarBorder} !important;
      }
      .ck-button {
        color: ${colors.buttonColor} !important;
      }
      .ck-button:hover {
        background-color: ${colors.buttonHoverBg} !important;
      }
      .ck-button.ck-on {
        background-color: ${colors.buttonOnBg} !important;
        color: ${colors.buttonColor} !important;
      }
    `,
  };

  useEffect(() => {
    setIsClient(true);
    const loadEditor = async () => {
      try {
        const editorModule = await import('@ckeditor/ckeditor5-build-classic');
        ClassicEditor = editorModule.default as unknown as CKEditorConstructor;
        setEditorLoaded(true);
      } catch (error) {
        console.error('Failed to load CKEditor:', error);
        setEditorLoaded(true);
      }
    };
    loadEditor();
  }, []);

  const handleEditorChange = (_event: unknown, editor: Editor) => {
    const enhancedEditor = editor as EditorWithExtras;
    onChange(enhancedEditor.getData());
  };

  if (!isClient || !editorLoaded) {
    return (
      <div className={`base-editor border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-colors duration-200 ${className}`}>
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <div className="text-gray-500 dark:text-gray-400">در حال بارگذاری ویرایشگر...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`base-editor border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-colors duration-200 ${className}`}>
      {ClassicEditor && (
        <CKEditor
          editor={ClassicEditor as never}
          config={editorConfiguration}
          data={value}
          onReady={(editor: Editor) => {
            const enhancedEditor = editor as EditorWithExtras;
            editorRef.current = enhancedEditor;

            const editableElement = enhancedEditor.ui.view.editable.element;

            if (editableElement) {
              const height = getResponsiveHeight();
              editableElement.style.height = `${height}px`;
              editableElement.style.minHeight = `${height}px`;
              editableElement.style.resize = 'none';
              editableElement.style.overflow = 'auto';
            }

            applyEditorTheme(enhancedEditor, isDark);

            const observer = new MutationObserver(() => {
              if (editableElement) {
                const height = getResponsiveHeight();
                editableElement.style.height = `${height}px`;
                editableElement.style.minHeight = `${height}px`;
              }
            });
            observer.observe(editableElement!, { attributes: true, attributeFilter: ['style'] });

            const handleResize = () => {
              const height = getResponsiveHeight();
              if (editableElement) {
                editableElement.style.height = `${height}px`;
                editableElement.style.minHeight = `${height}px`;
              }
            };

            window.addEventListener('resize', handleResize);
            return () => {
              window.removeEventListener('resize', handleResize);
              observer.disconnect();
            };
          }}
          onChange={handleEditorChange}
        />
      )}
    </div>
  );
}
