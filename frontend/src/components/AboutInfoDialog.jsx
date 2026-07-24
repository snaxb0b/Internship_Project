import {
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import Icon from "./Icon";


/*
 * เนื้อหา + ไดอะล็อกข้อมูล RT-DETR (About / History)
 * แยกออกมาเป็นโมดูลกลาง เพื่อให้ทั้ง dock (หน้า Landing)
 * และเมนู utility (หน้า Workspace) เรียกใช้ร่วมกันได้
 */
const dialogTopics = {
  what: {
    eyebrow: "What it is",
    title: "Real-Time Detection Transformer",
    description:
      "RT-DETR is a real-time, end-to-end object detector built on a Detection Transformer (DETR) architecture that finds and classifies multiple objects in an image.",
    details:
      "It pairs an efficient hybrid encoder with IoU-aware query selection, so it predicts object classes, confidence scores and bounding boxes directly — without the non-maximum suppression step many detectors rely on.",
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
        value: "Real-time, NMS-free",
      },
    ],
    resourceLabel: "Explore RT-DETR Docs",
    resourceHref: "https://docs.ultralytics.com/models/rtdetr/",
  },
  history: {
    eyebrow: "A short history of RT-DETR",
    title: "From research to practical tools",
    description:
      "RT-DETR was introduced by Baidu researchers in a 2023 paper on real-time, end-to-end object detection.",
    details:
      "Its transformer-based design brought real-time speed to end-to-end detection, and it is now available as a ready-to-use model in the Ultralytics toolkit.",
    timeline: [
      {
        year: "2020",
        title: "The original DETR",
        description:
          "Object detection was reframed as a direct set-prediction problem using transformers.",
      },
      {
        year: "2023",
        title: "The RT-DETR paper",
        description:
          "Baidu showed a Detection Transformer could match earlier real-time detectors at real-time speed.",
      },
      {
        year: "Today",
        title: "A practical open toolkit",
        description:
          "Ultralytics supports RT-DETR for prediction, training, validation and export.",
      },
    ],
    resourceLabel: "Read the RT-DETR paper",
    resourceHref: "https://arxiv.org/abs/2304.08069",
  },
};


export function BrandMark({
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


export function AboutInfoDialog({
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


export default AboutInfoDialog;
