import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ApiStatus from "./ApiStatus";
import Icon from "./Icon";
import { useTheme } from "../hooks/useTheme";


const navigationSteps = [
  {
    number: "1",
    icon: "upload",
    title: "Configure Prediction",
    description: "Model, confidence and image",
    target: "configuration",
  },
  {
    number: "2",
    icon: "sparkles",
    title: "Review Result",
    description: "Annotated image and detections",
    target: "result",
  },
  {
    number: "3",
    icon: "history",
    title: "Prediction History",
    description: "Open your recent results",
    target: "history",
  },
];


/*
 * แถบหัวหน้า Workspace
 *   ซ้าย : ปุ่ม Home (บ้าน) + ปุ่มเมนู hamburger เท่านั้น
 *   ขวา  : สถานะ API
 *
 * เมนู hamburger = การนำทาง Step 1-3 + สลับธีม +
 * ปุ่มปิดสีแดงเต็มความกว้าง (ไม่มีแบรนด์/ลิงก์อื่น)
 */
function AppHeader({
  apiStatus,
  apiError,
  onRetryApi,
  onGoHome,
}) {
  const [activeStep, setActiveStep] =
    useState(navigationSteps[0].target);

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);


  /*
   * ไฮไลต์ Step ที่กำลังดูอยู่ ตามตำแหน่งสกรอลล์
   */
  useEffect(() => {
    const sections = navigationSteps
      .map((step) =>
        document.getElementById(step.target)
      )
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    let scrollFrame;

    function updateActiveStep() {
      const viewportAnchor =
        window.innerHeight * 0.32;

      const isAtPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (isAtPageBottom) {
        setActiveStep(
          sections[sections.length - 1].id
        );
        return;
      }

      const currentSection = sections.reduce(
        (current, section) => {
          const sectionTop =
            section.getBoundingClientRect().top;

          if (
            sectionTop > viewportAnchor ||
            sectionTop <= current.top
          ) {
            return current;
          }

          return {
            section,
            top: sectionTop,
          };
        },
        {
          section: sections[0],
          top: Number.NEGATIVE_INFINITY,
        }
      ).section;

      setActiveStep(currentSection.id);
    }

    function scheduleActiveStepUpdate() {
      window.cancelAnimationFrame(scrollFrame);

      scrollFrame = window.requestAnimationFrame(
        updateActiveStep
      );
    }

    updateActiveStep();

    const sectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
          scheduleActiveStepUpdate,
          {
            rootMargin: "-32% 0px -67% 0px",
            threshold: 0,
          }
        )
        : null;

    sections.forEach((section) => {
      sectionObserver?.observe(section);
    });

    window.addEventListener(
      "scroll",
      scheduleActiveStepUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      scheduleActiveStepUpdate
    );

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      sectionObserver?.disconnect();

      window.removeEventListener(
        "scroll",
        scheduleActiveStepUpdate
      );

      window.removeEventListener(
        "resize",
        scheduleActiveStepUpdate
      );
    };
  }, []);


  /*
   * เปิดเมนู: ล็อกสกรอลล์ + โฟกัสรายการแรก + ดัก Tab
   * ให้วนในเมนู และปิดด้วย Escape
   */
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame =
      window.requestAnimationFrame(() => {
        drawerRef.current
          ?.querySelector(
            "a[href], button:not([disabled])"
          )
          ?.focus();
      });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);

        window.requestAnimationFrame(() => {
          menuButtonRef.current?.focus({
            preventScroll: true,
          });
        });

        return;
      }

      if (event.key === "Tab") {
        const focusableElements =
          drawerRef.current?.querySelectorAll(
            "a[href], button:not([disabled])"
          );

        if (!focusableElements?.length) {
          return;
        }

        const firstElement =
          focusableElements[0];

        const lastElement =
          focusableElements[
            focusableElements.length - 1
          ];

        if (
          event.shiftKey &&
          document.activeElement === firstElement
        ) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isMenuOpen]);


  const closeMenu = useCallback(
    (restoreFocus = false) => {
      setIsMenuOpen(false);

      if (restoreFocus) {
        window.requestAnimationFrame(() => {
          menuButtonRef.current?.focus({
            preventScroll: true,
          });
        });
      }
    },
    []
  );


  function handleStepClick(event, target) {
    event.preventDefault();

    setActiveStep(target);
    closeMenu(true);

    const section =
      document.getElementById(target);

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    section?.scrollIntoView({
      behavior: prefersReducedMotion
        ? "auto"
        : "smooth",
      block: "start",
    });
  }


  return (
    <>
      <div className="app-toolbar">
        <div className="app-toolbar-inner">
          <div className="app-toolbar-left">
            <button
              className="icon-toolbar-button"
              type="button"
              onClick={onGoHome}
              aria-label="Go to home page"
              title="Home"
            >
              <Icon name="home" size={21} />
            </button>

            <button
              ref={menuButtonRef}
              className="icon-toolbar-button menu-toggle"
              type="button"
              onClick={() => {
                setIsMenuOpen(true);
              }}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-controls="workspace-menu-drawer"
            >
              <Icon name="menu" size={23} />
            </button>
          </div>

          <ApiStatus
            status={apiStatus}
            error={apiError}
            onRetry={onRetryApi}
          />
        </div>
      </div>

      <div
        className={[
          "drawer-layer",
          isMenuOpen
            ? "drawer-layer--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={!isMenuOpen}
      >
        <button
          className="drawer-backdrop"
          type="button"
          onClick={() => {
            closeMenu(true);
          }}
          tabIndex={isMenuOpen ? 0 : -1}
          aria-label="Close menu"
        />

        <aside
          ref={drawerRef}
          className="side-drawer menu-drawer"
          id="workspace-menu-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-drawer-title"
        >
          <h2
            className="drawer-menu-title"
            id="menu-drawer-title"
          >
            Menu
          </h2>

          <nav
            className="drawer-navigation"
            aria-label="Workspace steps"
          >
            {navigationSteps.map((step) => {
              const isActive =
                step.target === activeStep;

              return (
                <a
                  key={step.target}
                  className={[
                    "drawer-step",
                    isActive
                      ? "drawer-step--active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  href={`#${step.target}`}
                  onClick={(event) => {
                    handleStepClick(
                      event,
                      step.target
                    );
                  }}
                  tabIndex={isMenuOpen ? 0 : -1}
                  aria-current={
                    isActive ? "step" : undefined
                  }
                >
                  <span className="drawer-step-marker">
                    <Icon name={step.icon} size={19} />
                    <small>{step.number}</small>
                  </span>

                  <span className="drawer-step-copy">
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                  </span>

                  <span className="drawer-step-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="drawer-footer-controls">
            <button
              type="button"
              className="drawer-utility drawer-theme-control"
              onClick={toggleTheme}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <span className="drawer-utility-icon">
                <Icon
                  name={isDark ? "sun" : "moon"}
                  size={19}
                />
              </span>

              <span className="drawer-utility-copy">
                <strong>
                  {isDark
                    ? "Light mode"
                    : "Dark mode"}
                </strong>
                <small>
                  Switch the appearance
                </small>
              </span>

              <span className="drawer-utility-state">
                {isDark ? "Dark" : "Light"}
              </span>
            </button>

            <button
              type="button"
              className="drawer-close-full"
              onClick={() => {
                closeMenu(true);
              }}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <Icon name="close" size={18} />
              Cancel
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}


export default AppHeader;
