import React, { useState, useRef } from 'react';
import { 
  Save, Send, Image as ImageIcon, Video, X, Plus, 
  Bold, Italic, Info, ChevronDown, CheckCircle,
  Layout, Maximize2, ExternalLink, Globe, Calendar, User
} from 'lucide-react';
import { Project, ProjectPhase, AuthUser } from '../types';

interface ProjectEditorProps {
  user: AuthUser;
  onCancel: () => void;
  onSave: (project: Project) => void;
}

const PHASES: ProjectPhase[] = ['Idea', 'MVP', 'Mercado Temprano', 'Escalado'];

export const ProjectEditor: React.FC<ProjectEditorProps> = ({ user, onCancel, onSave }) => {
  // Form State
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [phase, setPhase] = useState<ProjectPhase>('Idea');
  const [images, setImages] = useState<string[]>([]);
  
  // Tag State
  const [catInput, setCatInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);

  // UI State
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleFormat = (type: 'bold' | 'italic') => {
    if (!descriptionRef.current) return;
    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const wrapper = type === 'bold' ? '**' : '_';
    
    const newText = 
      description.substring(0, start) + 
      wrapper + 
      description.substring(start, end) + 
      wrapper + 
      description.substring(end);
      
    setDescription(newText);
    textarea.focus();
  };

  // Tag Handlers
  const handleTagKeyDown = (
    e: React.KeyboardEvent, 
    value: string, 
    setValue: (v: string) => void, 
    list: string[], 
    setList: (l: string[]) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (value.trim()) {
        const newTags = value.split(',').map(t => t.trim()).filter(t => t && !list.includes(t));
        setList([...list, ...newTags]);
        setValue('');
      }
    } else if (e.key === 'Backspace' && !value && list.length > 0) {
      setList(list.slice(0, -1));
    }
  };

  const removeTag = (tag: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.filter(t => t !== tag));
  };

  // Image Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: Project['status']) => {
    const newProject: Project = {
      id: Date.now().toString(),
      authorId: user.id,
      name,
      slogan,
      description,
      images,
      videoUrl,
      categories,
      technologies,
      phase,
      status,
      createdAt: new Date().toISOString()
    };
    onSave(newProject);
  };

  // Construct draft object for preview
  const draftProject: Project = {
    id: 'draft',
    authorId: user.id,
    name: name || 'Nombre del Proyecto',
    slogan: slogan || 'Tu slogan aparecerá aquí...',
    description: description || 'La descripción detallada de tu proyecto aparecerá aquí.',
    images,
    videoUrl,
    categories,
    technologies,
    phase,
    status: 'draft',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-gray-50">
      
      {/* --- LEFT COLUMN: FORM --- */}
      <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 border-b border-gray-200 pb-4">
            <h2 className="font-serif text-3xl text-terreta-dark mb-2">Sube tu Proyecto</h2>
            <p className="text-sm text-gray-500 font-sans">
              Comparte tu visión con la comunidad. Completa la información clave para incubación o inversores.
            </p>
          </div>

          <div className="space-y-8">
            
            {/* 1. Basic Info */}
            <section className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nombre del Proyecto <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-terreta-dark focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none placeholder-gray-300"
                  placeholder="Ej. Terreta Hub"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Slogan (Descripción Corta) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none placeholder-gray-300"
                  placeholder="Una línea que defina tu propuesta de valor..."
                  value={slogan}
                  onChange={e => setSlogan(e.target.value)}
                />
              </div>
            </section>

            {/* 2. The Pitch */}
            <section>
              <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                    El Pitch (Descripción Detallada) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-1">
                    <button onClick={() => handleFormat('bold')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Bold size={14}/></button>
                    <button onClick={() => handleFormat('italic')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Italic size={14}/></button>
                  </div>
              </div>
              <div className="relative">
                <textarea 
                    ref={descriptionRef}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none placeholder-gray-300 min-h-[200px] resize-y font-sans leading-relaxed"
                    placeholder="Cuenta tu historia. ¿Qué problema resuelves? ¿Cuál es tu solución? Usa **negrita** para resaltar."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
              </div>
            </section>

            {/* 3. Multimedia */}
            <section className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-serif text-lg text-terreta-dark mb-2 flex items-center gap-2">
                <ImageIcon size={18} /> Multimedia
              </h3>
              
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Imágenes Destacadas (Logos, Mockups)
                </label>
                <div className="flex flex-wrap gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden group shadow-sm">
                      <img src={img} className="w-full h-full object-cover" alt="preview" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#D97706] hover:text-[#D97706] transition-colors bg-white"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-bold mt-1">SUBIR</span>
                  </button>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 mt-4">
                  Video Pitch (YouTube/Vimeo)
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="url" 
                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                    placeholder="https://..."
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* 4. Details */}
            <section className="grid md:grid-cols-2 gap-6">
              
              {/* Categories */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Categoría / Sector
                  </label>
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 focus-within:border-[#D97706] focus-within:ring-1 focus-within:ring-[#D97706] transition-all">
                    {categories.map(cat => (
                      <span key={cat} className="bg-orange-50 text-[#D97706] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        {cat}
                        <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeTag(cat, categories, setCategories)} />
                      </span>
                    ))}
                    <input 
                      type="text" 
                      className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                      placeholder="Ej. Fintech, Salud..."
                      value={catInput}
                      onChange={e => setCatInput(e.target.value)}
                      onKeyDown={e => handleTagKeyDown(e, catInput, setCatInput, categories, setCategories)}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Presiona Enter o Coma para agregar.</p>
              </div>

              {/* Phase */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Fase del Proyecto
                  </label>
                  <div className="relative">
                    <select 
                      value={phase}
                      onChange={(e) => setPhase(e.target.value as ProjectPhase)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 appearance-none focus:border-[#D97706] outline-none cursor-pointer"
                    >
                      {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
                  </div>
              </div>

              {/* Tech Stack */}
              <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Tecnologías Usadas
                  </label>
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 focus-within:border-[#D97706] focus-within:ring-1 focus-within:ring-[#D97706] transition-all">
                    {technologies.map(tech => (
                      <span key={tech} className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        {tech}
                        <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeTag(tech, technologies, setTechnologies)} />
                      </span>
                    ))}
                    <input 
                      type="text" 
                      className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                      placeholder="Ej. React, Python, Solidity..."
                      value={techInput}
                      onChange={e => setTechInput(e.target.value)}
                      onKeyDown={e => handleTagKeyDown(e, techInput, setTechInput, technologies, setTechnologies)}
                    />
                  </div>
              </div>

            </section>

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <Info className="text-blue-500 flex-shrink-0" size={20} />
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Tu proyecto pasará por un breve proceso de revisión por parte del equipo de Terreta Hub antes de ser publicado visiblemente en la galería principal.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse md:flex-row gap-4 pt-4">
              <button 
                onClick={() => handleSubmit('draft')}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Guardar Borrador
              </button>
              <button 
                onClick={() => handleSubmit('review')}
                className="flex-[2] py-4 bg-[#D97706] text-white font-bold rounded-xl hover:bg-[#B45309] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Send size={18} /> Enviar para Revisión
              </button>
            </div>
            
            <div className="text-center">
                <button onClick={onCancel} className="text-sm text-gray-400 hover:text-red-500 hover:underline">Cancelar</button>
            </div>

          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: PREVIEW --- */}
      <div className="flex-1 bg-gray-100 hidden lg:flex flex-col items-center justify-center p-8 relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Maximize2 size={12} /> Vista Previa del Proyecto
          </div>

          {/* Browser Window Simulation */}
          <div className="w-full max-w-2xl h-[90%] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col ring-1 ring-black/5">
             
             {/* Browser Bar */}
             <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-4">
                <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                   <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="flex-1 bg-white h-7 rounded-md border border-gray-200 flex items-center px-3 text-xs text-gray-400 font-mono">
                   terretahub.com/proyectos/{name ? name.toLowerCase().replace(/\s/g,'-') : 'tu-proyecto'}
                </div>
             </div>

             {/* Content Scrollable */}
             <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                <ProjectRenderer project={draftProject} user={user} />
             </div>
          </div>
      </div>

    </div>
  );
};

// --- PREVIEW COMPONENT ---
// Renders the project page view
const ProjectRenderer: React.FC<{ project: Project; user: AuthUser }> = ({ project, user }) => {
  const coverImage = project.images.length > 0 ? project.images[0] : null;

  // Helper for embed
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`;
    if (url.includes('vimeo.com/')) {
        const matches = url.match(/vimeo\.com\/(\d+)/);
        return matches ? `https://player.vimeo.com/video/${matches[1]}` : url;
    }
    return url;
  };

  return (
    <div className="min-h-full pb-20">
       
       {/* Hero Image */}
       <div className="w-full h-48 sm:h-64 bg-gray-100 relative group overflow-hidden">
          {coverImage ? (
             <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-100 via-gray-200 to-gray-200">
                <div className="text-center opacity-30">
                   <ImageIcon size={48} className="mx-auto mb-2" />
                   <p className="font-serif italic">Tu imagen de portada</p>
                </div>
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
             {project.categories.length > 0 && (
                <div className="flex gap-2 mb-2">
                   {project.categories.map(c => (
                      <span key={c} className="text-[10px] font-bold uppercase bg-[#D97706] px-2 py-0.5 rounded text-white">{c}</span>
                   ))}
                </div>
             )}
             <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight">{project.name}</h1>
          </div>
       </div>

       <div className="px-6 md:px-10 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
             
             {/* Slogan */}
             <div>
                <h3 className="text-lg text-terreta-dark/70 font-serif italic border-l-4 border-[#D97706] pl-4">
                   {project.slogan}
                </h3>
             </div>

             {/* Video if exists */}
             {project.videoUrl && (
                <div className="rounded-xl overflow-hidden shadow-md aspect-video">
                   <iframe 
                      src={getEmbedUrl(project.videoUrl)} 
                      title="Project Video"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                   ></iframe>
                </div>
             )}

             {/* Description */}
             <div className="prose prose-stone prose-sm sm:prose-base max-w-none font-sans text-gray-700">
                {/* Simple markdown renderer fallback */}
                {project.description.split('\n').map((line, i) => {
                   // Render **bold**
                   const parts = line.split(/(\*\*.*?\*\*)/g);
                   return (
                      <p key={i} className="mb-4 leading-relaxed">
                         {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                               return <strong key={j} className="text-terreta-dark">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                         })}
                      </p>
                   )
                })}
             </div>

             {/* Gallery Grid */}
             {project.images.length > 1 && (
                <div className="grid grid-cols-2 gap-2 mt-8">
                   {project.images.slice(1).map((img, i) => (
                      <img key={i} src={img} className="rounded-lg shadow-sm object-cover w-full h-32" alt={`Gallery ${i}`} />
                   ))}
                </div>
             )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             {/* Author */}
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <img src={user.avatar} className="w-10 h-10 rounded-full" alt={user.name} />
                   <div>
                      <p className="text-sm font-bold text-terreta-dark">{user.name}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                   </div>
                </div>
                <button className="w-full bg-[#EBE5DA] text-terreta-dark text-xs font-bold py-2 rounded-lg hover:bg-[#D9CDB8]">
                   Ver Perfil
                </button>
             </div>

             {/* Phase */}
             <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                   <Calendar size={14}/> Fase
                </h4>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                   {project.phase}
                </span>
             </div>

             {/* Tech Stack */}
             {project.technologies.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                   <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                      <Layout size={14}/> Stack
                   </h4>
                   <div className="flex flex-wrap gap-2">
                      {project.technologies.map(t => (
                         <span key={t} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 font-mono">
                            {t}
                         </span>
                      ))}
                   </div>
                </div>
             )}

             {/* CTA */}
             <button className="w-full bg-[#D97706] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5">
                Contactar Proyecto
             </button>
          </div>

       </div>
    </div>
  );
};
