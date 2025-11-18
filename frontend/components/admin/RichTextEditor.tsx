'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Palette,
  Eye,
  EyeOff,
  FileText,
  Maximize2,
  X
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { uploadImage } from '@/lib/api';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, placeholder = 'Write your blog post content here...' }: RichTextEditorProps) => {
  const [showHtmlView, setShowHtmlView] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => element.getAttribute('width'),
              renderHTML: attributes => {
                if (!attributes.width) {
                  return {};
                }
                return {
                  width: attributes.width,
                };
              },
            },
            height: {
              default: null,
              parseHTML: element => element.getAttribute('height'),
              renderHTML: attributes => {
                if (!attributes.height) {
                  return {};
                }
                return {
                  height: attributes.height,
                };
              },
            },
          };
        },
      }).configure({
        HTMLAttributes: {
          class: 'rounded-lg',
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:top-3 before:left-4 before:text-gray-400 before:pointer-events-none',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setHtmlContent(html);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] px-4 py-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_img]:rounded-lg [&_img]:my-4 [&_img[width]]:max-w-none [&_img[height]]:h-auto [&_img:not([width])]:max-w-full [&_img:not([width])]:h-auto [&_a]:text-blue-600 [&_a]:underline [&_.ProseMirror-selectednode]:outline-none [&_*]:outline-none',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setHtmlContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        toast.loading('Uploading image...', { id: 'image-upload' });
        const uploadedUrl = await uploadImage(file);
        toast.success('Image uploaded successfully', { id: 'image-upload' });
        
        // Load image to get dimensions
        const img = new window.Image();
        img.onload = () => {
          setImageUrl(uploadedUrl);
          setImageWidth(img.width.toString());
          setImageHeight(img.height.toString());
          setOriginalAspectRatio(img.width / img.height);
          setIsEditingImage(false);
          setShowImageDialog(true);
        };
        img.src = uploadedUrl;
      } catch (error: any) {
        toast.error(error.message || 'Failed to upload image', { id: 'image-upload' });
      }
    };
    input.click();
  }, [editor]);

  const handleImageDimensionChange = useCallback((dimension: 'width' | 'height', value: string) => {
    if (dimension === 'width') {
      setImageWidth(value);
      if (maintainAspectRatio && originalAspectRatio && value) {
        const newHeight = Math.round(parseInt(value) / originalAspectRatio);
        setImageHeight(newHeight.toString());
      }
    } else {
      setImageHeight(value);
      if (maintainAspectRatio && originalAspectRatio && value) {
        const newWidth = Math.round(parseInt(value) * originalAspectRatio);
        setImageWidth(newWidth.toString());
      }
    }
  }, [maintainAspectRatio, originalAspectRatio]);

  const insertImageWithDimensions = useCallback(() => {
    if (!editor || !imageUrl) return;

    const attrs: { src: string; width?: string; height?: string } = { src: imageUrl };
    if (imageWidth) attrs.width = imageWidth;
    if (imageHeight) attrs.height = imageHeight;

    if (isEditingImage) {
      // Update existing image
      editor.chain().focus().updateAttributes('image', attrs).run();
    } else {
      // Insert new image
      editor.chain().focus().setImage(attrs).run();
    }

    setShowImageDialog(false);
    setImageUrl('');
    setImageWidth('');
    setImageHeight('');
    setOriginalAspectRatio(null);
    setIsEditingImage(false);
  }, [editor, imageUrl, imageWidth, imageHeight, isEditingImage]);

  const handleEditImageDimensions = useCallback(() => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);
    
    if (node && node.type.name === 'image') {
      const attrs = node.attrs;
      setImageUrl(attrs.src || '');
      setImageWidth(attrs.width || '');
      setImageHeight(attrs.height || '');
      setIsEditingImage(true);
      
      // Try to get aspect ratio from existing dimensions
      if (attrs.width && attrs.height) {
        setOriginalAspectRatio(parseInt(attrs.width) / parseInt(attrs.height));
      } else {
        // Load image to get original dimensions
        const img = new window.Image();
        img.onload = () => {
          setOriginalAspectRatio(img.width / img.height);
          if (!attrs.width && !attrs.height) {
            setImageWidth(img.width.toString());
            setImageHeight(img.height.toString());
          }
        };
        img.src = attrs.src;
      }
      
      setShowImageDialog(true);
    }
  }, [editor]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );

    setLinkUrl(previousUrl || '');
    setLinkText(selectedText || '');
    setShowLinkDialog(true);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;

    if (linkUrl.trim() === '') {
      // Remove link if URL is empty
      const previousUrl = editor.getAttributes('link').href;
      if (previousUrl) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      setShowLinkDialog(false);
      return;
    }

    // Ensure URL has protocol
    let finalUrl = linkUrl.trim();
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editor.state.selection.empty && !linkText.trim()) {
      // If no text selected and no link text provided, insert URL as text
      editor.chain().focus().insertContent(`<a href="${finalUrl}">${finalUrl}</a>`).run();
    } else if (editor.state.selection.empty && linkText.trim()) {
      // If no text selected but link text provided, insert link with custom text
      editor.chain().focus().insertContent(`<a href="${finalUrl}">${linkText}</a>`).run();
    } else {
      // If text is selected, make it a link
      editor.chain().focus().setLink({ href: finalUrl }).run();
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl, linkText]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: { 
    onClick: (e?: React.MouseEvent) => void; 
    isActive?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        isActive
          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const ToolbarSeparator = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" />
  );

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            isActive={editor.isActive('heading', { level: 4 })}
            title="Heading 4"
          >
            <Heading4 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBlockquote().run();
            }}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Font Family */}
        <div className="flex items-center gap-1">
          <select
            onChange={(e) => {
              e.stopPropagation();
              const fontFamily = e.target.value;
              
              // Only update if the font family actually changed
              const currentFont = editor.getAttributes('textStyle').fontFamily;
              if (currentFont === fontFamily || (!currentFont && fontFamily === '')) {
                return;
              }
              
              // Apply font family without forcing focus to improve performance
              if (fontFamily === '') {
                editor.chain().unsetFontFamily().run();
              } else {
                editor.chain().setFontFamily(fontFamily).run();
              }
            }}
            onMouseDown={(e) => {
              // Prevent the editor from losing focus when clicking the select
              e.stopPropagation();
            }}
            onClick={(e) => {
              // Prevent event bubbling
              e.stopPropagation();
            }}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            title="Font Family"
            defaultValue=""
          >
            <option value="">Default</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Impact">Impact</option>
          </select>
        </div>

        <ToolbarSeparator />

        {/* Text Color */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={(e) => {
              e.preventDefault();
              const input = document.createElement('input');
              input.type = 'color';
              const currentColor = editor.getAttributes('textStyle').color;
              input.value = currentColor || '#000000';
              input.onchange = (e) => {
                const color = (e.target as HTMLInputElement).value;
                if (editor.state.selection.empty) {
                  // If no selection, apply to future text
                  editor.chain().focus().setColor(color).run();
                } else {
                  // If text is selected, apply to selection
                  editor.chain().focus().setColor(color).run();
                }
              };
              input.click();
            }}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Link & Image */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={openLinkDialog}
            isActive={editor.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleImageUpload}
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleEditImageDimensions}
            disabled={!editor.isActive('image')}
            title="Edit Image Dimensions"
          >
            <Maximize2 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Code */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={(e) => {
              e.preventDefault();
              if (editor.state.selection.empty) {
                // If no selection, insert code mark for future typing
                editor.chain().focus().toggleCode().run();
              } else {
                // If text is selected, toggle code mark
                editor.chain().focus().toggleCode().run();
              }
            }}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex-1" />

        {/* HTML View Toggle */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => {
              if (showHtmlView) {
                editor.commands.setContent(htmlContent);
              }
              setShowHtmlView(!showHtmlView);
            }}
            title={showHtmlView ? 'Show Editor' : 'Show HTML'}
          >
            {showHtmlView ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      {showHtmlView ? (
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
          <textarea
            value={htmlContent}
            onChange={(e) => {
              setHtmlContent(e.target.value);
              onChange(e.target.value);
            }}
            onBlur={() => {
              editor.commands.setContent(htmlContent);
            }}
            rows={20}
            className="w-full pl-10 pr-4 py-3 border-0 focus:outline-none font-mono text-sm resize-none"
            placeholder="HTML content..."
          />
        </div>
      ) : (
        <div className="relative bg-white min-h-[400px]">
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Image Dimension Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Set Image Dimensions</h3>
              <button
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                  setImageWidth('');
                  setImageHeight('');
                  setOriginalAspectRatio(null);
                  setIsEditingImage(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preview
                </label>
                {imageUrl && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full max-h-[300px] rounded-lg object-contain"
                      style={{
                        width: imageWidth ? `${imageWidth}px` : 'auto',
                        height: imageHeight ? `${imageHeight}px` : 'auto',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Preset Sizes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preset Sizes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Small', w: '300', h: '200' },
                      { label: 'Medium', w: '600', h: '400' },
                      { label: 'Large', w: '800', h: '600' },
                      { label: 'Full Width', w: '100%', h: 'auto' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          if (preset.w === '100%') {
                            setImageWidth('');
                            setImageHeight('');
                          } else {
                            if (maintainAspectRatio && originalAspectRatio) {
                              const width = parseInt(preset.w);
                              const height = Math.round(width / originalAspectRatio);
                              setImageWidth(preset.w);
                              setImageHeight(height.toString());
                            } else {
                              setImageWidth(preset.w);
                              setImageHeight(preset.h);
                            }
                          }
                        }}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-orange-500 transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Width Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Width
                    </label>
                    <span className="text-sm text-gray-600">
                      {imageWidth ? `${imageWidth}px` : 'Auto'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1200"
                    step="50"
                    value={imageWidth ? parseInt(imageWidth) : 600}
                    onChange={(e) => handleImageDimensionChange('width', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={imageWidth}
                      onChange={(e) => handleImageDimensionChange('width', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Auto"
                      min="1"
                    />
                    <button
                      onClick={() => setImageWidth('')}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Height Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Height
                    </label>
                    <span className="text-sm text-gray-600">
                      {imageHeight ? `${imageHeight}px` : 'Auto'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="800"
                    step="50"
                    value={imageHeight ? parseInt(imageHeight) : 400}
                    onChange={(e) => handleImageDimensionChange('height', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={imageHeight}
                      onChange={(e) => handleImageDimensionChange('height', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Auto"
                      min="1"
                    />
                    <button
                      onClick={() => setImageHeight('')}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Maintain Aspect Ratio */}
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="maintain-aspect"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="maintain-aspect" className="ml-3 block text-sm font-medium text-gray-700">
                    Maintain aspect ratio
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowImageDialog(false);
                      setImageUrl('');
                      setImageWidth('');
                      setImageHeight('');
                      setOriginalAspectRatio(null);
                      setIsEditingImage(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={insertImageWithDimensions}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold shadow-md hover:shadow-lg"
                  >
                    {isEditingImage ? 'Update Image' : 'Insert Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Insert Link</h3>
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="https://example.com"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                />
              </div>

              {editor?.state.selection.empty && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link Text (optional)
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="Click here"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use URL as text
                  </p>
                </div>
              )}

              {!editor?.state.selection.empty && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Selected text: <strong>{editor.state.doc.textBetween(
                      editor.state.selection.from,
                      editor.state.selection.to
                    )}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl('');
                    setLinkText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={insertLink}
                  disabled={!linkUrl.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;

