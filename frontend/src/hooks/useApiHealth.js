import {
  useEffect,
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