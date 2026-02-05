document.addEventListener("DOMContentLoaded", () => {
    console.log("script.js carregou");

    // =========================
    // 1) HEADER: estado "scrolled" (sem tremer / sem duplicar)
    // =========================
    const header = document.querySelector(".site-header");
    if (header) {
        let isScrolled = false;

        // Histerese: evita ficar ligando/desligando perto do topo
        const ADD_AT = 60;
        const REMOVE_AT = 20;

        const onScrollHeader = () => {
            const y = window.scrollY || 0;

            if (!isScrolled && y > ADD_AT) {
                isScrolled = true;
                header.classList.add("scrolled");
                return;
            }

            if (isScrolled && y < REMOVE_AT) {
                isScrolled = false;
                header.classList.remove("scrolled");
            }
        };

        window.addEventListener("scroll", onScrollHeader, { passive: true });
        onScrollHeader();
    }

    // =========================
    // 2) REVEAL PREMIUM: cascata por seção (data-stagger)
    // =========================
    const sections = Array.from(document.querySelectorAll("[data-stagger]"));

    const applyStagger = (root) => {
        const items = Array.from(root.querySelectorAll(".fade-up"));
        if (!items.length) return;

        const isHero = root.id === "hero";

        const baseDelay = isHero ? 120 : 70; // intervalo entre itens
        const startDelay = isHero ? 120 : 0; // atraso inicial

        items.forEach((el, i) => {
            const d = startDelay + i * baseDelay;
            el.style.setProperty("--d", d + "ms"); // sem template literal pra não dar erro
        });
    };

    sections.forEach(applyStagger);

    const sectionObserver = ("IntersectionObserver" in window)
        ? new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const items = entry.target.querySelectorAll(".fade-up");
                    items.forEach((el) => el.classList.add("is-visible"));

                    obs.unobserve(entry.target);
                });
            },
            { threshold: 0.18, rootMargin: "0px 0px -12% 0px" }
        )
        : null;

    if (sectionObserver) {
        sections.forEach((sec) => sectionObserver.observe(sec));
    } else {
        // fallback sem IntersectionObserver
        sections.forEach((sec) => {
            sec.querySelectorAll(".fade-up").forEach((el) => el.classList.add("is-visible"));
        });
    }

    // =========================
    // 3) FALLBACK: fade-up fora de data-stagger (ainda anima)
    // =========================
    const outsideFadeUps = Array.from(document.querySelectorAll(".fade-up"))
        .filter((el) => !el.closest("[data-stagger]"));

    if (outsideFadeUps.length) {
        // delays simples e consistentes
        outsideFadeUps.forEach((el, i) => {
            if (!el.style.getPropertyValue("--d")) {
                el.style.setProperty("--d", (i * 70) + "ms");
            }
        });

        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("is-visible");
                            obs.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
            );

            outsideFadeUps.forEach((el) => io.observe(el));
        } else {
            outsideFadeUps.forEach((el) => el.classList.add("is-visible"));
        }
    }

    // =========================
    // 4) PROCESS: Animação do círculo passando (IntersectionObserver)
    // =========================
    const processSection = document.querySelector("#process");
    const indicator = document.querySelector(".process-indicator");
    const steps = document.querySelectorAll(".process-step");

    if (processSection && indicator && steps.length) {
        let isIntersecting = false;
        let animationTimeout = null;
        let currentStep = 0;

        const moveNext = () => {
            if (!isIntersecting) return;

            // Define o próximo passo (looping)
            if (currentStep >= steps.length) {
                currentStep = 0;
            }

            const step = steps[currentStep];
            const number = step.querySelector(".number");

            // Pisca o indicador: apaga, move e acende
            indicator.style.opacity = "0";

            setTimeout(() => {
                if (!isIntersecting) return;

                const rect = number.getBoundingClientRect();
                const parentRect = step.parentElement.getBoundingClientRect();
                const x = rect.left - parentRect.left;
                const y = rect.top - parentRect.top;

                indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;

                // Ativa o step
                steps.forEach((s) => s.classList.remove("active"));
                step.classList.add("active");

                // Acende
                setTimeout(() => {
                    if (!isIntersecting) return;
                    indicator.style.opacity = "1";
                    indicator.classList.add("is-active");
                }, 50);

                currentStep++;
                animationTimeout = setTimeout(moveNext, 2000); // 2s por etapa para leitura
            }, 300); // Tempo "apagado" entre transições
        };

        if ("IntersectionObserver" in window) {
            const processObserver = new IntersectionObserver((entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    if (!isIntersecting) {
                        isIntersecting = true;
                        moveNext();
                    }
                } else {
                    isIntersecting = false;
                    if (animationTimeout) clearTimeout(animationTimeout);
                    indicator.style.opacity = "0";
                    steps.forEach((s) => s.classList.remove("active"));
                }
            }, { threshold: 0.3 });
            processObserver.observe(processSection);
        } else {
            isIntersecting = true;
            moveNext();
        }
    }
});
