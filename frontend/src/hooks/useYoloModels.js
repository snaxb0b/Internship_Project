import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getAvailableModels,
} from "../api/yoloApi";


export function useYoloModels() {
  const [models, setModels] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const needsReloadRef = useRef(false);

  useEffect(() => {
    needsReloadRef.current =
      Boolean(error) ||
      models.length === 0;
  }, [error, models]);


  useEffect(() => {
    const controller =
      new AbortController();

    async function loadModels() {
      setLoading(true);
      setError("");

      try {
        const data =
          await getAvailableModels({
            signal: controller.signal,
          });

        const availableModels =
          Array.isArray(data.models)
            ? data.models
            : [];

        setModels(availableModels);
      } catch (requestError) {
        if (
          requestError.name !==
          "AbortError"
        ) {
          setModels([]);
          setError(requestError.message);
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadModels();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);


  /*
   * โหลดรายชื่อโมเดลใหม่อัตโนมัติ
   * เมื่อเน็ตกลับมา/กลับมาที่แท็บ
   * เฉพาะกรณีที่ยังโหลดไม่สำเร็จ
   */
  useEffect(() => {
    function reloadIfNeeded() {
      if (needsReloadRef.current) {
        setReloadKey(
          (currentKey) => currentKey + 1
        );
      }
    }

    function handleVisibility() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        reloadIfNeeded();
      }
    }

    window.addEventListener(
      "online",
      reloadIfNeeded
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.removeEventListener(
        "online",
        reloadIfNeeded
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);


  function reloadModels() {
    setReloadKey(
      (currentKey) => currentKey + 1
    );
  }


  return {
    models,
    loading,
    error,
    reloadModels,
  };
}