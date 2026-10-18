import React from "react";

interface ResultCarouselProps {
  result: string;
}

// Simple carousel that splits the result markdown into sections separated by double newlines
// and displays each section in a card. Scroll snapping provides a swipeable experience.
export default function ResultCarousel({ content }: { content: string }) {
  const sections = content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="carousel" role="region" aria-label="Result carousel">
      {sections.map((section, idx) => (
        <div key={idx} className="carousel-card">
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{section}</pre>
        </div>
      ))}
    </div>
  );
}
