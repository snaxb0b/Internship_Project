import {
  useCallback,
  useRef,
  useState,
} from "react";

import Icon from "./Icon";
import { useTheme } from "../hooks/useTheme";
import {
  AboutInfoDialog,
  BrandMark,
} from "./AboutInfoDialog";


/*
 * Dock ลอย (มุมขวาล่าง) สำหรับหน้า Landing —
 * About RT-DETR, ประวัติ, สลับธีม, GitHub
 * (หน้า Workspace ย้าย utility เหล่านี้ไปเมนู hamburger)
 */
function YoloBottomBar() {
  const [activeTopic, setActiveTopic] =
    useState(null);

  const activeTriggerRef = useRef(null);

  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";


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
          RT-DETR quick access
        </h2>

        <div
          className="yolo-bottom-bar"
          role="group"
          aria-label="RT-DETR information and resources"
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
            aria-label="About RT-DETR"
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
            aria-label="View RT-DETR history"
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
            aria-label="Open the Ultralytics RT-DETR repository on GitHub in a new tab"
          >
            <span className="yolo-bar-icon">
              <BrandMark
                name="github"
                className="yolo-bar-github-image"
              />
            </span>
          </a>

          <button
            className="yolo-bar-item yolo-bar-item--theme"
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              isDark
                ? "Light mode"
                : "Dark mode"
            }
          >
            <span className="yolo-bar-icon">
              <Icon
                name={isDark ? "moon" : "sun"}
                size={20}
              />
            </span>
          </button>
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
