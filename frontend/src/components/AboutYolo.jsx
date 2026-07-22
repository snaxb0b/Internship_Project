import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import Icon from "./Icon";


const dialogTopics = {
  what: {
    eyebrow: "What it is",
    title: "You Only Look Once",
    description:
      "YOLO is a family of real-time computer-vision models that can find and classify multiple objects in an image.",
    details:
      "The original approach evaluates the full image in one unified prediction, producing object classes, confidence scores and bounding boxes together.",
    facts: [
      {
        label: "Input",
        value: "Full image",
      },
      {
        label: "Output",
        value: "Boxes + classes",
      },
      {
        label: "Designed for",
        value: "Real-time detection",
      },
    ],
    resourceLabel: "Explore Ultralytics Docs",
    resourceHref: "https://docs.ultralytics.com/",
  },
  history: {
    eyebrow: "A short history of YOLO",
    title: "From research to practical tools",
    description:
      "Joseph Redmon, Santosh Divvala, Ross Girshick and Ali Farhadi introduced YOLO in a paper submitted in 2015.",
    details:
      "Its unified approach helped make fast object detection practical and inspired an ecosystem of models and computer-vision workflows.",
    timeline: [
      {
        year: "2015",
        title: "The original YOLO paper",
        description:
          "Object detection was reframed as one end-to-end regression problem.",
      },
      {
        year: "Today",
        title: "A practical open toolkit",
        description:
          "Ultralytics supports prediction, training, validation and export workflows.",
      },
    ],
    resourceLabel: "Read the original YOLO paper",
    resourceHref: "https://arxiv.org/abs/1506.02640",
  },
};


function BrandMark({
  name,
  className = "",
}) {
  if (name === "github") {
    return (
      <svg
        className={className}
        viewBox="0 0 19 19"
        aria-hidden="true"
        focusable="false"
      >
        <use href="/icons.svg#github-icon" />
      </svg>
    );
  }

  return (
    <img
      className={className}
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
    />
  );
}


function AboutInfoDialog({
  topic,
  onClose,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  const content = dialogTopics[topic];


  useEffect(() => {
    if (!content) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    const appRoot =
      document.getElementById("root");

    const rootWasInert =
      appRoot?.inert ?? false;

    document.body.style.overflow = "hidden";

    if (appRoot) {
      appRoot.inert = true;
    }

    const focusFrame =
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll(
          [
            "a[href]",
            "button:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(", ")
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

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow =
        previousOverflow;

      if (appRoot) {
        appRoot.inert = rootWasInert;
      }

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [content, onClose]);


  if (!content) {
    return null;
  }


  const isHistory = topic === "history";


  return createPortal(
    <div className="about-info-layer">
      <button
        className="about-info-backdrop"
        type="button"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Close information dialog"
      />

      <div
        ref={dialogRef}
        id="yolo-info-dialog"
        className={[
          "about-info-dialog",
          isHistory
            ? "about-info-dialog--history"
            : "about-info-dialog--yolo",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
        aria-describedby="about-dialog-description"
      >
        <div className="about-dialog-header">
          <span
            className={[
              "about-dialog-brand",
              isHistory
                ? "about-dialog-brand--history"
                : "about-dialog-brand--yolo",
            ].join(" ")}
          >
            {isHistory ? (
              <Icon name="history" size={25} />
            ) : (
              <BrandMark
                name="yolo"
                className="about-brand-image"
              />
            )}
          </span>

          <div className="about-dialog-title-copy">
            <span>{content.eyebrow}</span>
            <h2 id="about-dialog-title">
              {content.title}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            className="about-dialog-close"
            type="button"
            onClick={onClose}
            aria-label="Close information dialog"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="about-dialog-body">
          <p id="about-dialog-description">
            {content.description}
          </p>

          <p>{content.details}</p>

          {content.facts ? (
            <div className="about-dialog-facts">
              {content.facts.map((fact) => (
                <article key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </article>
              ))}
            </div>
          ) : (
            <ol className="about-dialog-timeline">
              {content.timeline.map((item) => (
                <li key={item.year}>
                  <span>{item.year}</span>

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="about-dialog-footer">
          <span>Official resource</span>

          <a
            href={content.resourceHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content.resourceLabel}
            <Icon name="external" size={16} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}


function YoloBottomBar() {
  const [activeTopic, setActiveTopic] =
    useState(null);

  const activeTriggerRef = useRef(null);


  function openTopic(topic, event) {
    activeTriggerRef.current =
      event.currentTarget;

    setActiveTopic(topic);
  }


  const closeTopic = useCallback(() => {
    setActiveTopic(null);

    window.requestAnimationFrame(() => {
      activeTriggerRef.current?.focus({
        preventScroll: true,
      });
    });
  }, []);


  return (
    <>
      <aside
        className="yolo-bottom-bar-shell"
        aria-labelledby="yolo-bottom-bar-title"
      >
        <h2
          className="sr-only"
          id="yolo-bottom-bar-title"
        >
          YOLO quick access
        </h2>

        <div
          className="yolo-bottom-bar"
          role="group"
          aria-label="YOLO information and resources"
        >
          <button
            className={[
              "yolo-bar-item",
              "yolo-bar-item--yolo",
              activeTopic === "what"
                ? "yolo-bar-item--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            onClick={(event) => {
              openTopic("what", event);
            }}
            aria-haspopup="dialog"
            aria-expanded={activeTopic === "what"}
            aria-controls="yolo-info-dialog"
            aria-label="About YOLO"
          >
            <span className="yolo-bar-icon">
              <BrandMark
                name="yolo"
                className="yolo-bar-brand-image"
              />
            </span>
          </button>

          <button
            className={[
              "yolo-bar-item",
              "yolo-bar-item--history",
              activeTopic === "history"
                ? "yolo-bar-item--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            onClick={(event) => {
              openTopic("history", event);
            }}
            aria-haspopup="dialog"
            aria-expanded={activeTopic === "history"}
            aria-controls="yolo-info-dialog"
            aria-label="View YOLO history"
          >
            <span className="yolo-bar-icon">
              <Icon name="history" size={21} />
            </span>
          </button>

          <a
            className="yolo-bar-item yolo-bar-item--github"
            href="https://github.com/ultralytics/ultralytics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Ultralytics YOLO on GitHub in a new tab"
          >
            <span className="yolo-bar-icon">
              <BrandMark
                name="github"
                className="yolo-bar-github-image"
              />
            </span>
          </a>
        </div>
      </aside>

      <AboutInfoDialog
        topic={activeTopic}
        onClose={closeTopic}
      />
    </>
  );
}


export default YoloBottomBar;
