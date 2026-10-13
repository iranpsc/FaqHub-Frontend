'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EditorConfig, Translations } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

/** Minimal Editor-like type to avoid version conflicts between CKEditor packages */
interface CKEditorInstance {
  plugins: { get: (name: string) => unknown };
  getData: () => string;
}

type EditorWithExtras = CKEditorInstance & {
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
  toolbarBg: isDark ? '#374151' : '#f8f9fa',
  toolbarBorder: isDark ? '#4b5563' : '#c4c4c4',
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
  const [editorModule, setEditorModule] = useState<typeof import('ckeditor5') | null>(null);
  const [faTranslations, setFaTranslations] = useState<Translations | null>(null);
  const editorRef = useRef<EditorWithExtras | null>(null);
  const onReadyCleanupRef = useRef<(() => void) | null>(null);

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

  const editorConfiguration = useMemo((): EditorConfig | null => {
    if (!editorModule) return null;

    const {
      Alignment,
      Autoformat,
      Base64UploadAdapter,
      BlockQuote,
      Bold,
      Essentials,
      Font,
      Heading,
      Image,
      ImageCaption,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Italic,
      Link,
      List,
      MediaEmbed,
      Paragraph,
      PasteFromOffice,
      Strikethrough,
      Table,
      TableToolbar,
      Underline,
    } = editorModule;

    const plugins = [
      Essentials,
      Paragraph,
      Heading,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Font,
      List,
      Indent,
      IndentBlock,
      Alignment,
      Link,
      BlockQuote,
      Table,
      TableToolbar,
      Image,
      ImageCaption,
      ImageStyle,
      ImageToolbar,
      ImageTextAlternative,
      Autoformat,
      PasteFromOffice,
      MediaEmbed,
      ...(imageUpload ? [ImageUpload, Base64UploadAdapter] : []),
    ] as NonNullable<EditorConfig['plugins']>;

    return {
      licenseKey: 'GPL',
      plugins,
      placeholder,
      language: rtl ? 'fa' : 'en',
      translations: rtl && faTranslations ? [faTranslations] : undefined,
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
      image: {
        toolbar: [
          'imageTextAlternative',
          'toggleImageCaption',
          'imageStyle:inline',
          'imageStyle:block',
          'imageStyle:side',
        ],
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
      },
    };
  }, [editorModule, faTranslations, imageUpload, placeholder, rtl]);

  useEffect(() => {
    setIsClient(true);
    let cancelled = false;

    const loadEditor = async () => {
      try {
        const [ckeditor, fa] = await Promise.all([
          import('ckeditor5'),
          import('ckeditor5/translations/fa.js'),
        ]);
        if (cancelled) return;
        setEditorModule(ckeditor);
        setFaTranslations(fa.default);
      } catch (error) {
        console.error('Failed to load CKEditor:', error);
      } finally {
        if (!cancelled) setEditorLoaded(true);
      }
    };

    loadEditor();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      onReadyCleanupRef.current?.();
    },
    []
  );

  const handleEditorChange = (_event: unknown, editor: CKEditorInstance) => {
    onChange(editor.getData());
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

  if (!editorModule || !editorConfiguration) {
    return (
      <div className={`base-editor border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-colors duration-200 ${className}`} />
    );
  }

  return (
    <div className={`base-editor border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-colors duration-200 ${className}`}>
      <CKEditor
        editor={editorModule.ClassicEditor}
        config={editorConfiguration}
        data={value}
        onReady={(editor) => {
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
          onReadyCleanupRef.current = () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
          };
        }}
        onChange={handleEditorChange}
      />
    </div>
  );
}
