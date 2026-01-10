import React from 'react';

// Helper function to generate URL-friendly slug from project name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Helper to normalize URLs - ensures they have a protocol
export const normalizeUrl = (url: string): string => {
  if (!url || url === '#') return '#';
  
  // If URL already has a protocol, return as is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  
  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // Otherwise, add https://
  return `https://${url}`;
};

// Helper to render markdown text with bold (**text**) and links (URLs)
export const renderMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  // Split by lines to preserve line breaks
  return text.split('\n').map((line, lineIndex) => {
    if (!line.trim()) {
      return React.createElement('br', { key: lineIndex });
    }
    
    // Process line: find all matches (bold and URLs)
    const matches: Array<{ type: 'bold' | 'url'; start: number; end: number; content: string; originalLength: number }> = [];
    
    // Find bold matches (**text**) - non-greedy to match shortest first
    const boldRegex = /\*\*([^*\n]+?)\*\*/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(line)) !== null) {
      matches.push({
        type: 'bold',
        start: boldMatch.index,
        end: boldMatch.index + boldMatch[0].length,
        content: boldMatch[1].trim(), // Content without **, trimmed
        originalLength: boldMatch[0].length
      });
    }
    
    // Find URL matches (https://, http://, or www.) - improved regex
    const urlRegex = /(https?:\/\/[^\s\)\]\>]+|www\.[^\s\)\]\>]+)/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(line)) !== null) {
      // Check if this URL is inside a bold match
      const isInsideBold = matches.some(m => 
        m.type === 'bold' && 
        urlMatch.index >= m.start && 
        urlMatch.index < m.end
      );
      
      // Only add URL if it's not inside bold (we'll handle URLs in bold separately)
      if (!isInsideBold) {
        matches.push({
          type: 'url',
          start: urlMatch.index,
          end: urlMatch.index + urlMatch[0].length,
          content: urlMatch[0],
          originalLength: urlMatch[0].length
        });
      }
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Build parts array
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let partKey = 0;
    
    for (const match of matches) {
      // Add text before match
      if (match.start > currentIndex) {
        const beforeText = line.substring(currentIndex, match.start);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      
      // Add the match
      if (match.type === 'bold') {
        // Check if bold content contains URLs
        const boldContent = match.content;
        const urlInBoldRegex = /(https?:\/\/[^\s\)]+|www\.[^\s\)]+)/gi;
        const urlInBold = urlInBoldRegex.exec(boldContent);
        
        if (urlInBold) {
          // Bold contains URL - split it
          const urlStart = urlInBold.index;
          const urlEnd = urlStart + urlInBold[0].length;
          const beforeUrl = boldContent.substring(0, urlStart);
          const urlText = urlInBold[0];
          const afterUrl = boldContent.substring(urlEnd);
          
          const boldParts: React.ReactNode[] = [];
          if (beforeUrl) boldParts.push(beforeUrl);
          
          const url = urlText.startsWith('http') ? urlText : `https://${urlText}`;
          boldParts.push(
            React.createElement('a', {
              key: `${lineIndex}-bold-url-${partKey}`,
              href: url,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'text-terreta-accent hover:underline'
            }, urlText)
          );
          
          if (afterUrl) boldParts.push(afterUrl);
          
          parts.push(
            React.createElement('strong', {
              key: `${lineIndex}-bold-${partKey}`,
              className: 'font-bold text-terreta-dark'
            }, boldParts)
          );
        } else {
          // Simple bold text
          parts.push(
            React.createElement('strong', {
              key: `${lineIndex}-bold-${partKey}`,
              className: 'font-bold text-terreta-dark'
            }, boldContent)
          );
        }
      } else if (match.type === 'url') {
        const url = match.content.startsWith('http') ? match.content : `https://${match.content}`;
        parts.push(
          React.createElement('a', {
            key: `${lineIndex}-url-${partKey}`,
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-terreta-accent hover:underline'
          }, match.content)
        );
      }
      
      currentIndex = match.end;
      partKey++;
    }
    
    // Add remaining text
    if (currentIndex < line.length) {
      const remainingText = line.substring(currentIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }
    
    // If no matches, return plain text
    if (parts.length === 0) {
      parts.push(line);
    }
    
    return React.createElement('p', {
      key: lineIndex,
      className: 'mb-4 leading-relaxed'
    }, parts);
  });
};