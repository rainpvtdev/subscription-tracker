import React, { useState } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  items: FaqItem[];
}

const Faq: React.FC<FaqProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      {items.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="faq-toggle w-full flex justify-between items-center p-6 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            onClick={() => handleToggle(idx)}
            aria-expanded={openIndex === idx}
            aria-controls={`faq-content-${idx}`}
          >
            <h3 className="text-lg font-semibold text-left">{item.question}</h3>
            <i
              className={`fas fa-chevron-down text-purple-600 transition-transform ${openIndex === idx ? "rotate-180" : ""}`}
            ></i>
          </button>
          <div
            id={`faq-content-${idx}`}
            className={`faq-content px-6 pb-6 pt-0 bg-white transition-all duration-300 ${openIndex === idx ? "block" : "hidden"}`}
          >
            <p className="text-gray-600">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Faq;
