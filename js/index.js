document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("section");
    let current = Math.round(window.scrollY / window.innerHeight);
    let animating = false;

    const scrollToSection = (index) => {
        animating = true;
        window.scrollTo({
            top: window.innerHeight * index,
            behavior: "smooth"
        });
        setTimeout(() => (animating = false), 1000);
    };

    const handleScroll = (e) => {
        if (animating) {
            e.preventDefault();
            return;
        }

        if (current === 0 && e.deltaY < 0) return;
        if (current === sections.length - 1 && e.deltaY > 0) return;

        e.preventDefault();

        if (e.deltaY > 0 && current < sections.length - 1) {
            current++;
        } else if (e.deltaY < 0 && current > 0) {
            current--;
        }

        scrollToSection(current);
    };

    window.addEventListener("wheel", handleScroll, { passive: false });

    window.addEventListener("keydown", (e) => {
        if (animating) return;

        if (e.key === "ArrowDown" && current < sections.length - 1) {
            current++;
            scrollToSection(current);
        } else if (e.key === "ArrowUp" && current > 0) {
            current--;
            scrollToSection(current);
        }
    });

    setTimeout(() => scrollToSection(current), 100);
});