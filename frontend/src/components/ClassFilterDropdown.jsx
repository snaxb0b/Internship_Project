import {
  useEffect,
  useRef,
  useState,
} from "react";

import Icon from "./Icon";
import { rgbString } from "../utils/detectionColors";


/*
 * Dropdown "Filter" — checkbox ต่อคลาสที่ตรวจพบ
 *
 * - รายการคลาสสร้างจากผลตรวจจับจริง (dynamic)
 * - มี "Select all" เปิด/ปิดทุกคลาสในคลิกเดียว
 * - state ของการเลือกอยู่ที่ Parent (แหล่งความจริง
 *   เดียว) Component นี้เป็นเพียงตัวควบคุมการแสดงผล
 */
function ClassFilterDropdown({
  classes,
  selected,
  onToggleClass,
  onSetAll,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const total = classes.length;

  const selectedCount = classes.reduce(
    (count, item) =>
      selected.has(item.name) ? count + 1 : count,
    0
  );

  const allSelected =
    total > 0 && selectedCount === total;

  const noneSelected = selectedCount === 0;


  /*
   * ปิดเมนูเมื่อคลิกนอกกรอบ หรือกด Escape
   * ผูก listener เฉพาะตอนเมนูเปิดเท่านั้น
   */
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );
    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);


  const summaryLabel = allSelected
    ? "All classes"
    : noneSelected
    ? "None selected"
    : `${selectedCount} of ${total}`;

  const selectAllState = allSelected
    ? "checked"
    : noneSelected
    ? "empty"
    : "indeterminate";

  return (
    <div
      className="class-filter"
      ref={containerRef}
    >
      <button
        type="button"
        className="class-filter-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        <span className="class-filter-toggle-icon">
          <Icon name="filter" size={16} />
        </span>

        <span className="class-filter-toggle-text">
          <span className="class-filter-toggle-label">
            Filter
          </span>
          <span className="class-filter-toggle-value">
            {summaryLabel}
          </span>
        </span>

        <span
          className={
            open
              ? "class-filter-caret is-open"
              : "class-filter-caret"
          }
          aria-hidden="true"
        >
          <Icon name="chevronDown" size={16} />
        </span>
      </button>

      {open && (
        <div
          className="class-filter-menu"
          role="group"
          aria-label="Filter detections by class"
        >
          <label className="class-filter-option class-filter-option--all">
            <input
              type="checkbox"
              className="class-filter-native"
              checked={allSelected}
              ref={(node) => {
                if (node) {
                  node.indeterminate =
                    selectAllState ===
                    "indeterminate";
                }
              }}
              onChange={() =>
                onSetAll(!allSelected)
              }
            />

            <span
              className={
                selectAllState === "checked"
                  ? "class-filter-box is-checked"
                  : selectAllState ===
                    "indeterminate"
                  ? "class-filter-box is-indeterminate"
                  : "class-filter-box"
              }
              aria-hidden="true"
            >
              {selectAllState === "checked" && (
                <Icon name="check" size={12} />
              )}
              {selectAllState ===
                "indeterminate" && (
                <Icon name="minus" size={12} />
              )}
            </span>

            <span className="class-filter-option-name">
              Select all
            </span>

            <span className="class-filter-option-count">
              {total}
            </span>
          </label>

          <div
            className="class-filter-divider"
            aria-hidden="true"
          />

          <div className="class-filter-list">
            {classes.map((item) => {
              const isChecked = selected.has(
                item.name
              );

              return (
                <label
                  key={item.name}
                  className="class-filter-option"
                >
                  <input
                    type="checkbox"
                    className="class-filter-native"
                    checked={isChecked}
                    onChange={() =>
                      onToggleClass(item.name)
                    }
                  />

                  <span
                    className={
                      isChecked
                        ? "class-filter-box is-checked"
                        : "class-filter-box"
                    }
                    aria-hidden="true"
                  >
                    {isChecked && (
                      <Icon
                        name="check"
                        size={12}
                      />
                    )}
                  </span>

                  <span
                    className="class-filter-swatch"
                    style={{
                      background: rgbString(
                        item.color
                      ),
                    }}
                    aria-hidden="true"
                  />

                  <span className="class-filter-option-name">
                    {item.name}
                  </span>

                  <span className="class-filter-option-count">
                    {item.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


export default ClassFilterDropdown;
