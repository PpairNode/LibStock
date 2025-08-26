import React, { useState } from "react";
import "./ImageLightbox.css"; // import the external CSS file

const ImageLightbox = ({ src, alt }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <img
        src={src}
        alt={alt}
        className="thumbnail-image"
        onClick={() => setIsOpen(true)}
      />

      {/* Lightbox */}
      {isOpen && (
        <div
          className="lightbox-overlay"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="lightbox-image"
            onClick={e => e.stopPropagation()} // prevent close on image click
          />
        </div>
      )}
    </>
  );
};

export default ImageLightbox;
