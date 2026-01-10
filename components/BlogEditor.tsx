import React, { useState, useRef } from 'react';
import { Save, Send, Image as ImageIcon, X, Plus, Bold, Italic, List, Hash, Type } from 'lucide-react';
import { AuthUser, Blog } from '../types';
import { supabase } from '../lib/supabase';
import { generateBlogSlug, validateBlogSlug, uploadBlogCardImage, uploadBlogContentImage, validateImageFile, getBlogImageUrl, truncateExcerpt } from '../lib/blogUtils';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';

interface BlogEditorProps {
  user: AuthUser;
  blog?: Blog; // Para edición
  onCancel: () => void;
  onSave: () => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ user, blog, onCancel, onSave }) => {
  const [title, setTitle] = useState(blog?.title || '');
  const [content, setContent] = useState(blog?.content || '');
  const [excerpt, setExcerpt] = useState(blog?.excerpt || '');
  const [primaryTag, setPrimaryTag] = useState(blog?.primaryTag || '');
  const [additionalTags, setAdditionalTags] = useState<string[]>(blog?.tags?.filter(t => t !== blog.primaryTag) || []);
  const [tagInput, setTagInput] = useState('');
  
  // Imágenes
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(
    blog?.cardImagePath ? getBlogImageUrl(blog.cardImagePath) : null
  );
  const [contentImages, setContentImages] = useState<File[]>([]);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const cardImageInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);

  const handleFormat = (type: 'bold' | 'italic' | 'list' | 'heading') => {
    if (!contentRef.current) return;
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let wrapper = '';
    let newText = '';
    
    switch (type) {
      case 'bold':
        wrapper = '**';
        newText = content.substring(0, start) + wrapper + selectedText + wrapper + content.substring(end);
        break;
      case 'italic':
        wrapper = '_';
        newText = content.substring(0, start) + wrapper + selectedText + wrapper + content.substring(end);
        break;
      case 'list':
        const lines = selectedText.split('\n');
        const listItems = lines.map(line => line.trim() ? `- ${line.trim()}` : line).join('\n');
        newText = content.substring(0, start) + listItems + content.substring(end);
        break;
      case 'heading':
        newText = content.substring(0, start) + '## ' + selectedText + content.substring(end);
        break;
    }
    
    setContent(newText);
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
    }, 0);
  };

  const handleCardImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, cardImage: validation.error || 'Error al validar imagen' }));
      return;
    }

    setCardImageFile(file);
    setErrors(prev => ({ ...prev, cardImage: '' }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCardImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleContentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    files.forEach(file => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        setErrors(prev => ({ ...prev, contentImages: validation.error || 'Error al validar imagen' }));
      }
    });

    setContentImages(prev => [...prev, ...validFiles]);
  };

  const removeContentImage = (index: number) => {
    setContentImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !additionalTags.includes(tagInput.trim())) {
        setAdditionalTags(prev => [...prev, tagInput.trim()]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && additionalTags.length > 0) {
      setAdditionalTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setAdditionalTags(prev => prev.filter(t => t !== tag));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!content.trim()) {
      newErrors.content = 'El contenido es obligatorio';
    }

    if (!excerpt.trim()) {
      newErrors.excerpt = 'La descripción breve es obligatoria';
    } else if (excerpt.length > 140) {
      newErrors.excerpt = 'La descripción no puede exceder 140 caracteres';
    }

    if (!primaryTag.trim()) {
      newErrors.primaryTag = 'El tag principal es obligatorio';
    }

    if (!cardImageFile && !blog?.cardImagePath) {
      newErrors.cardImage = 'La imagen de card es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Generar slug
      const baseSlug = generateBlogSlug(title, user.username);
      let finalSlug = baseSlug;
      let slugCounter = 1;

      while (!(await validateBlogSlug(finalSlug, blog?.id))) {
        finalSlug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }

      let blogId: string;
      let cardImagePath = blog?.cardImagePath;

      if (blog) {
        // Actualizar blog existente
        // Si hay nueva imagen, subirla primero
        if (cardImageFile) {
          cardImagePath = await uploadBlogCardImage(user.id, blog.id, cardImageFile);
        }

        const blogData: any = {
          author_id: user.id,
          title: title.trim(),
          slug: finalSlug,
          content: content.trim(),
          excerpt: truncateExcerpt(excerpt.trim(), 140),
          card_image_path: cardImagePath,
          primary_tag: primaryTag.trim(),
          tags: [primaryTag.trim(), ...additionalTags],
          status
        };

        const { data, error } = await executeQueryWithRetry(
          async () => await supabase
            .from('blogs')
            .update(blogData)
            .eq('id', blog.id)
            .select()
            .single(),
          'update blog'
        );

        if (error) throw error;
        blogId = data.id;
      } else {
        // Crear nuevo blog primero (sin imagen)
        const blogData: any = {
          author_id: user.id,
          title: title.trim(),
          slug: finalSlug,
          content: content.trim(),
          excerpt: truncateExcerpt(excerpt.trim(), 140),
          card_image_path: null, // Se actualizará después
          primary_tag: primaryTag.trim(),
          tags: [primaryTag.trim(), ...additionalTags],
          status
        };

        const { data, error } = await executeQueryWithRetry(
          async () => await supabase
            .from('blogs')
            .insert(blogData)
            .select()
            .single(),
          'create blog'
        );

        if (error) throw error;
        blogId = data.id;

        // Ahora subir la imagen de card con el ID correcto
        if (cardImageFile) {
          cardImagePath = await uploadBlogCardImage(user.id, blogId, cardImageFile);
          
          // Actualizar el path en el blog
          await supabase
            .from('blogs')
            .update({ card_image_path: cardImagePath })
            .eq('id', blogId);
        }
      }

      // Subir imágenes de contenido si hay (solo para nuevos blogs)
      if (contentImages.length > 0 && !blog) {
        let updatedContent = content;
        for (const imageFile of contentImages) {
          const imagePath = await uploadBlogContentImage(user.id, blogId, imageFile);
          const imageUrl = getBlogImageUrl(imagePath);
          
          // Insertar referencia en el contenido markdown
          updatedContent += `\n![Imagen](${imageUrl})\n`;
        }
        
        // Actualizar el contenido con las imágenes
        if (updatedContent !== content) {
          await supabase
            .from('blogs')
            .update({ content: updatedContent })
            .eq('id', blogId);
        }
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving blog:', err);
      alert('Error al guardar el blog: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const excerptLength = excerpt.length;
  const excerptMaxLength = 140;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border p-6">
        {/* Header */}
        <div className="mb-6 border-b border-terreta-border pb-4">
          <h2 className="font-serif text-2xl font-bold text-terreta-dark mb-2">
            {blog ? 'Editar blog' : 'Nuevo blog'}
          </h2>
          <p className="text-sm text-terreta-secondary">
            Comparte tus ideas, tutoriales y reflexiones con la comunidad
          </p>
        </div>

        <div className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-bold text-terreta-dark mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de tu blog"
              className="w-full bg-terreta-bg border border-terreta-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Descripción breve */}
          <div>
            <label className="block text-sm font-bold text-terreta-dark mb-2">
              Descripción breve (máx 140 caracteres) *
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= excerptMaxLength) {
                  setExcerpt(value);
                }
              }}
              placeholder="Breve descripción que aparecerá en la card..."
              rows={3}
              className="w-full bg-terreta-bg border border-terreta-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.excerpt && (
                <p className="text-red-500 text-xs">{errors.excerpt}</p>
              )}
              <p className={`text-xs ml-auto ${excerptLength > excerptMaxLength * 0.9 ? 'text-yellow-500' : 'text-terreta-secondary'}`}>
                {excerptLength}/{excerptMaxLength}
              </p>
            </div>
          </div>

          {/* Imagen de card */}
          <div>
            <label className="block text-sm font-bold text-terreta-dark mb-2">
              Imagen de card *
            </label>
            {cardImagePreview ? (
              <div className="relative w-full max-w-md">
                <img
                  src={cardImagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-terreta-border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCardImagePreview(null);
                    setCardImageFile(null);
                    if (cardImageInputRef.current) cardImageInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cardImageInputRef.current?.click()}
                className="w-full max-w-md h-48 border-2 border-dashed border-terreta-border rounded-lg flex flex-col items-center justify-center gap-2 text-terreta-secondary hover:border-terreta-accent hover:text-terreta-accent transition-colors"
              >
                <ImageIcon size={32} />
                <span className="text-sm">Click para subir imagen</span>
              </button>
            )}
            <input
              ref={cardImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCardImageSelect}
              className="hidden"
            />
            {errors.cardImage && (
              <p className="text-red-500 text-xs mt-1">{errors.cardImage}</p>
            )}
          </div>

          {/* Tag principal */}
          <div>
            <label className="block text-sm font-bold text-terreta-dark mb-2">
              Tag principal *
            </label>
            <input
              type="text"
              value={primaryTag}
              onChange={(e) => setPrimaryTag(e.target.value)}
              placeholder="Ej: Tecnología, Diseño, Tutorial..."
              className="w-full bg-terreta-bg border border-terreta-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark"
            />
            {errors.primaryTag && (
              <p className="text-red-500 text-xs mt-1">{errors.primaryTag}</p>
            )}
          </div>

          {/* Tags adicionales */}
          <div>
            <label className="block text-sm font-bold text-terreta-dark mb-2">
              Tags adicionales (opcional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {additionalTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-terreta-bg border border-terreta-border rounded-full text-xs text-terreta-dark"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Escribe y presiona Enter para agregar"
              className="w-full bg-terreta-bg border border-terreta-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark"
            />
          </div>

          {/* Contenido markdown */}
          <div>
            <label className="block text-sm font-bold text-terreta-dark mb-2">
              Contenido (Markdown) *
            </label>
            
            {/* Toolbar */}
            <div className="flex gap-2 mb-2 p-2 bg-terreta-bg rounded-lg border border-terreta-border">
              <button
                type="button"
                onClick={() => handleFormat('bold')}
                className="p-2 hover:bg-terreta-sidebar rounded transition-colors"
                title="Negrita"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('italic')}
                className="p-2 hover:bg-terreta-sidebar rounded transition-colors"
                title="Itálica"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('list')}
                className="p-2 hover:bg-terreta-sidebar rounded transition-colors"
                title="Lista"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('heading')}
                className="p-2 hover:bg-terreta-sidebar rounded transition-colors"
                title="Encabezado"
              >
                <Hash size={16} />
              </button>
              <div className="border-l border-terreta-border mx-1" />
              <button
                type="button"
                onClick={() => contentImageInputRef.current?.click()}
                className="p-2 hover:bg-terreta-sidebar rounded transition-colors"
                title="Agregar imagen"
              >
                <ImageIcon size={16} />
              </button>
            </div>

            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu contenido en Markdown..."
              rows={20}
              className="w-full bg-terreta-bg border border-terreta-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark font-mono resize-none"
            />
            {errors.content && (
              <p className="text-red-500 text-xs mt-1">{errors.content}</p>
            )}

            <input
              ref={contentImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleContentImageSelect}
              className="hidden"
            />

            {/* Preview de imágenes de contenido */}
            {contentImages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {contentImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border border-terreta-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeContentImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4 border-t border-terreta-border">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-terreta-border rounded-full font-bold text-terreta-dark hover:bg-terreta-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className="px-6 py-2 bg-terreta-bg border border-terreta-border rounded-full font-bold text-terreta-dark hover:bg-terreta-sidebar transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              Guardar borrador
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={isSaving}
              className="px-6 py-2 bg-terreta-accent text-white rounded-full font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  Publicar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
