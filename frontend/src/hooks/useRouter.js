import {
  useCallback,
  useEffect,
  useState,
} from "react";


/*
 * Router แบบเบา ๆ ด้วย History API (ไม่พึ่งไลบรารี)
 *
 * รองรับ 2 เส้นทาง:
 *   "/"        -> landing (หน้าแนะนำ)
 *   "/detect"  -> workspace (Step 1-3)
 *
 * - navigate() ใช้ pushState เปลี่ยน URL จริง
 * - ปุ่ม Back/Forward ของเบราว์เซอร์ทำงานผ่าน popstate
 * - เปิด/รีเฟรช /detect ตรง ๆ ได้ (อ่าน path ตอนเริ่ม)
 *   โดยฝั่งเซิร์ฟเวอร์ต้อง fallback มา index.html
 *   (Vite dev/preview ทำให้อยู่แล้ว, prod ดู nginx.conf)
 */
const WORKSPACE_PATH = "/detect";


function readRoute() {
  if (typeof window === "undefined") {
    return "landing";
  }

  const path = window.location.pathname.replace(
    /\/+$/,
    ""
  );

  return path.endsWith(WORKSPACE_PATH)
    ? "workspace"
    : "landing";
}


export function useRouter() {
  const [route, setRoute] = useState(readRoute);


  useEffect(() => {
    function handlePopState() {
      setRoute(readRoute());
    }

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);


  const navigate = useCallback((to) => {
    if (to !== window.location.pathname) {
      window.history.pushState({}, "", to);
    }

    setRoute(readRoute());

    /*
     * เปลี่ยนหน้า = เริ่มอ่านจากบนสุดเสมอ
     * (เคารพ reduced-motion)
     */
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);


  return {
    route,
    navigate,
    goToWorkspace: useCallback(
      () => navigate(WORKSPACE_PATH),
      [navigate]
    ),
    goToLanding: useCallback(
      () => navigate("/"),
      [navigate]
    ),
  };
}
