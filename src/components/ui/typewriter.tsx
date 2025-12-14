import { useState, useEffect } from 'react';

export const Typewriter = ({ texts, speed = 100, delay = 2000 }: { texts: string[], speed?: number, delay?: number }) => {
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentText, setCurrentText] = useState('');

    useEffect(() => {
        const handleTyping = () => {
            const fullText = texts[textIndex];

            if (isDeleting) {
                setCurrentText(fullText.substring(0, charIndex - 1));
                setCharIndex(prev => prev - 1);
            } else {
                setCurrentText(fullText.substring(0, charIndex + 1));
                setCharIndex(prev => prev + 1);
            }

            if (!isDeleting && charIndex === fullText.length) {
                setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setTextIndex((prev) => (prev + 1) % texts.length);
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? speed / 2 : speed);
        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, speed, delay, texts, textIndex]);

    return (
        <span className="border-r-2 border-white pr-1 animate-pulse min-h-[1.5em] inline-block">
            {currentText}
        </span>
    );
};
