import {
  useEffect,
  useRef,
  useState,
} from "react";

import ApiStatus from "./ApiStatus";
import Icon from "./Icon";


const navigationSteps = [
  {
    number: "01",
    icon: "upload",
    title: "Configure prediction",
    description: "Model, confidence and image",
    target: "configuration",
  },
  {
    number: "02",
    icon: "sparkles",
    title: "Review result",
    description: "Annotated image and detections",
    target: "result",
  },
  {
    number: "03",
    icon: "history",
    title: "Prediction history",
    description: "Open your recent results",
    target: "history",
  },
];


function AppHeader({
  apiStatus,
  apiError,
  onRetryApi,
}) {
  const [activeStep, setActiveStep] =
    useState(navigationSteps[0].target);

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);


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


  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame =
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
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


  function closeMenu(restoreFocus = false) {
    setIsMenuOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        menuButtonRef.current?.focus({
          preventScroll: true,
        });
      });
    }
  }


  return (
    <>
      <div className="app-toolbar">
        <div className="app-toolbar-inner">
          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            onClick={() => {
              setIsMenuOpen(true);
            }}
            aria-label="Open step navigation"
            aria-expanded={isMenuOpen}
            aria-controls="step-navigation-drawer"
          >
            <Icon name="menu" size={23} />
          </button>

          <ApiStatus
            status={apiStatus}
            error={apiError}
            onRetry={onRetryApi}
          />
        </div>
      </div>

      <header
        className="app-header"
      >
        <div
          className="header-orb header-orb--one"
          aria-hidden="true"
        />

        <div
          className="header-orb header-orb--two"
          aria-hidden="true"
        />

        <div className="header-inner">
          <div className="hero-content" id="top">
            <h1>
              Object <span>Detection</span>
            </h1>

            <p className="header-description">
              Upload an image, choose a YOLO model,
              and turn every detection into a clear,
              visual result in just a few steps.
            </p>

            <div className="hero-highlights">
              <span>
                <Icon name="check" size={16} />
                Fast predictions
              </span>

              <span>
                <Icon name="check" size={16} />
                Visual results
              </span>

              <span>
                <Icon name="check" size={16} />
                Local history
              </span>
            </div>

            <div
              className="hero-workflow-card"
              aria-label="Prediction workflow"
            >
              <div className="hero-workflow-flow">
                <strong className="hero-workflow-stage">
                  Choose a Model
                </strong>

                <span className="hero-workflow-arrow">
                  <Icon name="arrow" size={18} />
                </span>

                <strong className="hero-workflow-stage">
                  Set the Threshold
                </strong>

                <span className="hero-workflow-arrow">
                  <Icon name="arrow" size={18} />
                </span>

                <strong className="hero-workflow-stage">
                  Review detection
                </strong>
              </div>

              <div className="hero-workflow-note">
                <span>
                  <Icon name="info" size={16} />
                </span>

                <p>
                  Detection quality depends on the selected model,
                  confidence threshold, image quality and training data.
                  Always review important results before relying on them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
          aria-label="Close navigation menu"
        />

        <aside
          ref={drawerRef}
          className="side-drawer"
          id="step-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <div className="drawer-header">
            <div className="drawer-brand">
              <span className="drawer-brand-mark">
                <Icon name="logo" size={22} />
              </span>

              <span>
                <strong>Computer Vision</strong>
                <small>Detection workspace</small>
              </span>
            </div>

            <button
              ref={closeButtonRef}
              className="drawer-close-button"
              type="button"
              onClick={() => {
                closeMenu(true);
              }}
              tabIndex={isMenuOpen ? 0 : -1}
              aria-label="Close navigation menu"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="drawer-copy">
            <span>Workspace navigation</span>
            <h2 id="drawer-title">
              Jump to a section
            </h2>
            <p>
              Move between each part of your computer-vision
              workspace.
            </p>
          </div>

          <nav
            className="drawer-navigation"
            aria-label="Workspace sections"
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
                  onClick={() => {
                    setActiveStep(step.target);
                    closeMenu(true);
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

          <div className="drawer-footer">
            <Icon name="info" size={17} />
            <span>
              Your current form values stay in place
              when you move between sections.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}


export default AppHeader;
