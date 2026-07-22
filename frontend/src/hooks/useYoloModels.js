import {
  useEffect,
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