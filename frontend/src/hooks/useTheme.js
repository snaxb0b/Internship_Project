import {
  useCallback,
  useEffect,
  useState,
} from "react";


const STORAGE_KEY = "theme";


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

      setTheme(
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
    setTheme((previousTheme) => {
      const nextTheme =
        previousTheme === "dark"
          ? "light"
          : "dark";

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          nextTheme
        );
      } catch {
        /* localStorage อาจถูกปิดใช้งาน */
      }

      return nextTheme;
    });
  }, []);


  return { theme, toggleTheme };
}
