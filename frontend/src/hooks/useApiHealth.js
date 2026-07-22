import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getApiHealth,
} from "../api/yoloApi";


export function useApiHealth() {
  const [status, setStatus] =
    useState("checking");

  const [error, setError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);


  useEffect(() => {
    const controller =
      new AbortController();

    async function checkHealth() {
      setStatus("checking");
      setError("");

      try {
        const data =
          await getApiHealth({
            signal: controller.signal,
          });

        if (data.status === "healthy") {
          setStatus("online");
        } else {
          setStatus("offline");
          setError(
            "API returned an unhealthy status"
          );
        }
      } catch (requestError) {
        if (
          requestError.name !==
          "AbortError"
        ) {
          setStatus("offline");
          setError(requestError.message);
        }
      }
    }

    checkHealth();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);


  /*
   * ตรวจสุขภาพ API ใหม่อัตโนมัติ
   * เมื่อเน็ตกลับมา หรือกลับมาที่แท็บ
   * ทั้งนี้เฉพาะตอนที่ยังไม่ online
   * เพื่อไม่ให้ยิง request โดยไม่จำเป็น
   */
  useEffect(() => {
    function recheck() {
      setReloadKey(
        (currentKey) => currentKey + 1
      );
    }

    function handleOnline() {
      if (statusRef.current !== "online") {
        recheck();
      }
    }

    function handleVisibility() {
      if (
        document.visibilityState ===
          "visible" &&
        statusRef.current !== "online"
      ) {
        recheck();
      }
    }

    window.addEventListener(
      "online",
      handleOnline
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);


  function retryHealthCheck() {
    setReloadKey(
      (currentKey) => currentKey + 1
    );
  }


  return {
    status,
    error,
    retryHealthCheck,
  };
}