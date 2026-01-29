import { useEffect } from 'react';

interface MetaTagsData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'product' | 'video' | 'music' | 'book';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  structuredData?: object; // JSON-LD structured data
}

/**
 * Hook para actualizar meta tags dinámicamente (Open Graph, Twitter, etc.)
 * Útil para compartir enlaces con preview personalizado y mejorar SEO
 */
export const useDynamicMetaTags = (data: MetaTagsData) => {
  useEffect(() => {
    if (!data.title && !data.description && !data.image) {
      return;
    }

    const baseUrl = 'https://terretahub.com';
    const fullUrl = data.url ? (data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`) : baseUrl;

    const updateMetaTag = (property: string, content: string) => {
      // Buscar meta tag existente
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      
      // Si no existe, crear uno nuevo
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    const updateMetaTagName = (name: string, content: string) => {
      // Buscar meta tag existente
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      
      // Si no existe, crear uno nuevo
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Actualizar título de la página
    if (data.title) {
      document.title = data.title;
      updateMetaTagName('title', data.title);
    }

    // Meta description
    if (data.description) {
      updateMetaTagName('description', data.description);
    }

    // Open Graph meta tags
    const ogType = data.type || 'website';
    updateMetaTag('og:type', ogType);
    
    if (data.title) {
      updateMetaTag('og:title', data.title);
    }
    
    if (data.description) {
      updateMetaTag('og:description', data.description);
    }
    
    if (data.image) {
      const imageUrl = data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`;
      updateMetaTag('og:image', imageUrl);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:type', 'image/jpeg');
      updateMetaTag('og:image:secure_url', imageUrl);
    } else {
      // Imagen por defecto si no se proporciona
      updateMetaTag('og:image', `${baseUrl}/logo.png`);
    }
    
    updateMetaTag('og:url', fullUrl);
    updateMetaTag('og:site_name', 'Terreta Hub');
    updateMetaTag('og:locale', 'es_ES');

    // Twitter Card meta tags
    updateMetaTagName('twitter:card', 'summary_large_image');
    
    if (data.title) {
      updateMetaTagName('twitter:title', data.title);
    }
    
    if (data.description) {
      updateMetaTagName('twitter:description', data.description);
    }
    
    if (data.image) {
      const imageUrl = data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`;
      updateMetaTagName('twitter:image', imageUrl);
    }

    // Article-specific meta tags
    if (ogType === 'article') {
      if (data.author) {
        updateMetaTag('article:author', data.author);
      }
      if (data.publishedTime) {
        updateMetaTag('article:published_time', data.publishedTime);
      }
      if (data.modifiedTime) {
        updateMetaTag('article:modified_time', data.modifiedTime);
      }
      if (data.section) {
        updateMetaTag('article:section', data.section);
      }
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => {
          const meta = document.createElement('meta');
          meta.setAttribute('property', 'article:tag');
          meta.setAttribute('content', tag);
          document.head.appendChild(meta);
        });
      }
    }

    // Canonical URL
    updateLinkTag('canonical', fullUrl);

    // Structured Data (JSON-LD)
    if (data.structuredData) {
      // Eliminar structured data anterior si existe
      const existingScript = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-dynamic', 'true');
      script.textContent = JSON.stringify(data.structuredData);
      document.head.appendChild(script);
    }

    // Cleanup: restaurar meta tags originales cuando el componente se desmonte
    return () => {
      // Limpiar structured data dinámico
      const dynamicScript = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [data.title, data.description, data.image, data.url, data.type, data.author, data.publishedTime, data.modifiedTime, data.section, data.tags, data.structuredData]);
};

