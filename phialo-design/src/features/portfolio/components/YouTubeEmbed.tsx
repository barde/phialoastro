import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  aspectRatio?: '16:9' | '9:16';
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ 
  videoId, 
  title, 
  aspectRatio = '16:9' 
}) => {
  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video';
  const maxWidthClass = aspectRatio === '9:16' ? 'max-w-sm' : 'max-w-2xl';

  return (
    <div className="my-8 flex justify-center">
      <div className={`w-full ${maxWidthClass}`}>
        <div className={`relative ${aspectClass}`}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            loading="lazy"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};