import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, Heart, ThumbsDown } from 'lucide-react';
import { Blog } from '../types';
import { getBlogImageUrl, truncateExcerpt } from '../lib/blogUtils';

interface BlogCardProps {
  blog: Blog;
  showStats?: boolean; // Mostrar likes y vistas
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog, showStats = true }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/blog/${blog.author.username}/${blog.slug}`);
  };

  const cardImageUrl = blog.cardImagePath 
    ? getBlogImageUrl(blog.cardImagePath)
    : 'https://via.placeholder.com/400x250?text=Blog';

  const excerpt = truncateExcerpt(blog.excerpt || '', 140);
  const formattedDate = new Date(blog.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div
      onClick={handleClick}
      className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      {/* Imagen de card */}
      <div className="relative w-full h-48 overflow-hidden bg-terreta-bg">
        <img
          src={cardImageUrl}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Overlay sutil en hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Contenido */}
      <div className="p-5">
        {/* Primary Tag */}
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-terreta-accent/10 text-terreta-accent border border-terreta-accent/20">
            {blog.primaryTag}
          </span>
        </div>

        {/* Título */}
        <h3 className="font-serif text-lg font-bold text-terreta-dark mb-2 leading-tight line-clamp-2 group-hover:text-terreta-accent transition-colors">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-terreta-secondary mb-4 line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Footer: Autor y Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-terreta-border/30">
          {/* Autor */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-terreta-border/50">
              <img
                src={blog.author.avatar}
                alt={blog.author.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-terreta-dark">
                {blog.author.name}
              </span>
              <span className="text-[10px] text-terreta-secondary">
                @{blog.author.username}
              </span>
            </div>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-3 text-xs text-terreta-secondary">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{blog.viewsCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} className={blog.userLikeType === 'like' ? 'text-red-500 fill-red-500' : ''} />
                <span>{blog.likesCount}</span>
              </div>
              {blog.dislikesCount !== undefined && blog.dislikesCount > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsDown size={12} className={blog.userLikeType === 'dislike' ? 'text-red-500 fill-red-500' : ''} />
                  <span>{blog.dislikesCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
