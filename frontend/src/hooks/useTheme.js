import {
  useCallback,
  useEffect,
  useState,
} from "react";


const STORAGE_KEY = "theme";

/*
 * มี useTheme() หลายที่ในหน้าเดียวกัน (เมนู workspace
 * + dock หน้า landing ที่ mount ค้างไว้) จึง broadcast
 * ผ่าน custom event ให้ทุก instance sync ธีมตรงกัน
 */
const THEME_EVENT = "app:themechange";


/*
 * ธีมเริ่มต้นถูกตั้งไว้บน <html data-theme="...">
 * ตั้งแต่ใน index.html (ก่อน paint) เพื่อไม่ให้จอกระพริบ
 * hook นี้จึงอ่านค่าปัจจุบันจาก DOM มาเป็นค่าตั้งต้น
 */
function readInitialTheme() {
  if (typeof document === "undefined") {
    return "light";
  }

  const current =
    document.documentElement.getAttribute(
      "data-theme"
    );

  return current === "dark"
    ? "dark"
    : "light";
}


/*
 * ตั้งธีมบน DOM (แหล่งความจริง) แล้วกระจายให้ทุก
 * instance ของ useTheme อัปเดต state ตาม
 */
function applyTheme(nextTheme) {
  document.documentElement.setAttribute(
    "data-theme",
    nextTheme
  );

  window.dispatchEvent(
    new CustomEvent(THEME_EVENT, {
      detail: nextTheme,
    })
  );
}


export function useTheme() {
  const [theme, setTheme] =
    useState(readInitialTheme);


  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );
  }, [theme]);


  /*
   * sync ทุก instance ในแท็บเดียวกัน เมื่อมีการ
   * เปลี่ยนธีมจากที่ใดก็ตาม
   */
  useEffect(() => {
    function handleThemeEvent(event) {
      setTheme(
        event.detail === "dark"
          ? "dark"
          : "light"
      );
    }

    window.addEventListener(
      THEME_EVENT,
      handleThemeEvent
    );

    return () => {
      window.removeEventListener(
        THEME_EVENT,
        handleThemeEvent
      );
    };
  }, []);


  /*
   * ตามการตั้งค่าของระบบ (OS) เฉพาะกรณี
   * ที่ผู้ใช้ยังไม่ได้เลือกธีมเองไว้ใน localStorage
   */
  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function handleChange(event) {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (
        stored === "light" ||
        stored === "dark"
      ) {
        return;
      }

      applyTheme(
        event.matches ? "dark" : "light"
      );
    }

    media.addEventListener(
      "change",
      handleChange
    );

    return () => {
      media.removeEventListener(
        "change",
        handleChange
      );
    };
  }, []);


  const toggleTheme = useCallback(() => {
    const current =
      document.documentElement.getAttribute(
        "data-theme"
      ) === "dark"
        ? "dark"
        : "light";

    const nextTheme =
      current === "dark" ? "light" : "dark";

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        nextTheme
      );
    } catch {
      /* localStorage อาจถูกปิดใช้งาน */
    }

    applyTheme(nextTheme);
  }, []);


  return { theme, toggleTheme };
}
