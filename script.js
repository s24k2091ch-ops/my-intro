document.addEventListener('DOMContentLoaded', () => {
    // Initial Load Animation
    const loadElements = document.querySelectorAll('.animate-on-load');
    loadElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        }, index * 200);
    });

    // Scroll Animation using Intersection Observer
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // observer.unobserve(entry.target); // Uncomment if you want animation to happen only once
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        observer.observe(element);
    });
});
