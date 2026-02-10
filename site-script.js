document.addEventListener("DOMContentLoaded", () => {
    console.log("script.js carregou");

    // =========================
    // 1) HEADER: estado "scrolled"
    // =========================
    const header = document.querySelector(".site-header");
    if (header) {
        let isScrolled = false;

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
    // Agora repete ao descer e ao subir
    // =========================
    const sections = Array.from(document.querySelectorAll("[data-stagger]"));

    const applyStagger = (root) => {
        const items = Array.from(root.querySelectorAll(".fade-up"));
        if (!items.length) return;

        const isHero = root.id === "hero";
        const baseDelay = isHero ? 120 : 70;
        const startDelay = isHero ? 120 : 0;

        items.forEach((el, i) => {
            const d = startDelay + i * baseDelay;
            el.style.setProperty("--d", d + "ms");
        });
    };

    sections.forEach(applyStagger);

    const setFadeUpsVisible = (root, visible) => {
        const items = root.querySelectorAll(".fade-up");
        items.forEach((el) => {
            if (visible) el.classList.add("is-visible");
            else el.classList.remove("is-visible");
        });
    };

    if ("IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setFadeUpsVisible(entry.target, entry.isIntersecting);
                });
            },
            { threshold: 0.18, rootMargin: "0px 0px -12% 0px" }
        );

        sections.forEach((sec) => sectionObserver.observe(sec));
    } else {
        sections.forEach((sec) => setFadeUpsVisible(sec, true));
    }

    // =========================
    // 3) FALLBACK: fade-up fora de data-stagger
    // Agora repete ao descer e ao subir
    // =========================
    const outsideFadeUps = Array.from(document.querySelectorAll(".fade-up"))
        .filter((el) => !el.closest("[data-stagger]"));

    if (outsideFadeUps.length) {
        outsideFadeUps.forEach((el, i) => {
            if (!el.style.getPropertyValue("--d")) {
                el.style.setProperty("--d", (i * 70) + "ms");
            }
        });

        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) entry.target.classList.add("is-visible");
                        else entry.target.classList.remove("is-visible");
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
    // 4) PROCESS: Animação do círculo passando
    // (já estava correto: pausa ao sair, volta ao entrar)
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

            if (currentStep >= steps.length) currentStep = 0;

            const step = steps[currentStep];
            const number = step.querySelector(".number");

            // Move indicator smoothly without hiding it
            const rect = number.getBoundingClientRect();
            const parentRect = processSection.querySelector(".process-timeline").getBoundingClientRect();
            const x = rect.left - parentRect.left;
            const y = rect.top - parentRect.top;

            indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            indicator.classList.add("is-active");

            steps.forEach((s) => s.classList.remove("active"));
            step.classList.add("active");

            currentStep++;
            animationTimeout = setTimeout(moveNext, 1200);
        };

        if ("IntersectionObserver" in window) {
            const processObserver = new IntersectionObserver(
                (entries) => {
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
                },
                { threshold: 0.3 }
            );

            processObserver.observe(processSection);
        } else {
            isIntersecting = true;
            moveNext();
        }
    }

    // =========================
    // 5) REVEAL via data-reveal (repete ao subir e descer)
    // Se você não usa, pode remover essa parte
    // =========================
    const revealItems = document.querySelectorAll("[data-reveal]");
    if (revealItems.length && "IntersectionObserver" in window) {
        const revealIO = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add("is-visible");
                    else entry.target.classList.remove("is-visible");
                });
            },
            { threshold: 0.15 }
        );

        revealItems.forEach((el) => revealIO.observe(el));
    } else if (revealItems.length) {
        revealItems.forEach((el) => el.classList.add("is-visible"));
    }

    // =========================
    // 6) REAL PARALLAX ENGINE (otimizado)
    // =========================
    class ParallaxEngine {
        constructor() {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

            this.targets = [];
            this.isMobile = window.innerWidth <= 768;

            this.activeTargetsCount = 0;
            this.running = false;

            this.lastScrollY = window.scrollY || 0;
            this.smoothScrollPos = this.lastScrollY;

            this.hasPingpongVisible = false;
            this.needsRender = true; // render inicial

            this.init();

            window.addEventListener(
                "resize",
                () => {
                    this.isMobile = window.innerWidth <= 768;
                    this.needsRender = true;
                    this.start();
                },
                { passive: true }
            );

            window.addEventListener(
                "scroll",
                () => {
                    this.lastScrollY = window.scrollY || 0;
                    this.needsRender = true;
                    this.start();
                },
                { passive: true }
            );
        }

        init() {
            const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
            if (!parallaxEls.length) return;

            this.targets = parallaxEls.map((el) => {
                // micro-otimização: força GPU e avisa o browser
                el.style.willChange = "transform";
                el.style.transform = "translate3d(0,0,0)";

                return {
                    el,
                    speed: parseFloat(el.getAttribute("data-speed")) || 0.1,
                    axis: el.getAttribute("data-axis") || "y",
                    direction: parseInt(el.getAttribute("data-direction")) || 1,
                    pingpong: el.getAttribute("data-pingpong") === "true",
                    isVisible: false,
                    lastX: null,
                    lastY: null,
                };
            });

            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        let pingpongNow = false;

                        entries.forEach((entry) => {
                            const t = this.targets.find((x) => x.el === entry.target);
                            if (!t) return;

                            if (entry.isIntersecting) {
                                if (!t.isVisible) {
                                    t.isVisible = true;
                                    this.activeTargetsCount++;
                                }
                            } else {
                                if (t.isVisible) {
                                    t.isVisible = false;
                                    this.activeTargetsCount--;
                                }
                            }
                        });

                        // recalcula se tem pingpong visível
                        this.targets.forEach((t) => {
                            if (t.isVisible && t.pingpong) pingpongNow = true;
                        });
                        this.hasPingpongVisible = pingpongNow;

                        this.needsRender = true;
                        if (this.activeTargetsCount > 0) this.start();
                        else this.stop();
                    },
                    { threshold: 0.01, rootMargin: "150px 0px 150px 0px" } // pré-ativa antes de entrar
                );

                this.targets.forEach((t) => observer.observe(t.el));
            } else {
                this.targets.forEach((t) => (t.isVisible = true));
                this.activeTargetsCount = this.targets.length;
                this.hasPingpongVisible = this.targets.some((t) => t.pingpong);
                this.start();
            }
        }

        start() {
            if (this.running) return;
            if (this.activeTargetsCount <= 0) return;

            this.running = true;
            requestAnimationFrame((ts) => this.render(ts));
        }

        stop() {
            this.running = false;
        }

        render() {
            if (!this.running) return;

            // Se não precisa renderizar e não tem pingpong, dorme
            if (!this.needsRender && !this.hasPingpongVisible) {
                this.running = false;
                return;
            }

            const lerp = (a, b, t) => a + (b - a) * t;

            // suaviza scroll só quando mudou
            this.smoothScrollPos = lerp(this.smoothScrollPos, this.lastScrollY, 0.08);

            const time = performance.now() * 0.001;

            for (const t of this.targets) {
                if (!t.isVisible) continue;

                let offset = this.smoothScrollPos * t.speed * t.direction;
                if (this.isMobile) offset *= 0.4;

                if (t.pingpong) {
                    const oscSpeed = 1.0;
                    const amplitude = this.isMobile ? 8 : 15;
                    const phase = t.el.offsetTop * 0.01;
                    offset += Math.sin(time * oscSpeed + phase) * amplitude;
                }

                const x = t.axis === "x" ? offset : 0;
                const y = t.axis === "y" ? offset : 0;

                // evita setar style se não mudou (reduz custo)
                const rx = Math.round(x * 100) / 100;
                const ry = Math.round(y * 100) / 100;

                if (t.lastX !== rx || t.lastY !== ry) {
                    t.el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
                    t.lastX = rx;
                    t.lastY = ry;
                }
            }

            this.needsRender = false;
            requestAnimationFrame(() => this.render());
        }
    }

    new ParallaxEngine();

    // =========================
    // 7) AOS (opcional)
    // Se você já usa fade-up e data-reveal, eu recomendo remover AOS
    // =========================
    if (window.AOS) {
        AOS.init({
            once: false,
            mirror: true,
            duration: 700,
            offset: 80,
        });

        window.addEventListener("load", () => AOS.refreshHard());
        window.addEventListener("resize", () => AOS.refresh());
    }

    // =========================
    // 8) NUMBER COUNTER (Fast counting animation from zero)
    // =========================
    const counters = document.querySelectorAll(".proof-number");

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute("data-target"));
            const prefix = counter.getAttribute("data-prefix") || "";
            const suffix = counter.getAttribute("data-suffix") || "";
            const duration = 1200; // 1.2 seconds (fast but visible)
            const startTime = performance.now();

            const updateCount = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out expo for a "premium" feel
                const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const currentCount = Math.floor(easeOutExpo * target);

                counter.innerText = `${prefix}${currentCount}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = `${prefix}${target}${suffix}`;
                }
            };

            requestAnimationFrame(updateCount);
        });
    };

    if (counters.length && "IntersectionObserver" in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounters();
                counterObserver.disconnect(); // Run once
            }
        }, { threshold: 0.5 });

        const socialSection = document.querySelector(".social-proof");
        if (socialSection) counterObserver.observe(socialSection);
    }
});
