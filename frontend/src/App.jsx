import { useRef, useState } from "react";

import {
  predictUploadedImage,
} from "./api/yoloApi";

import { useToast } from "./context/toastContext";

import AppHeader from "./components/AppHeader";
import PredictionForm from "./components/PredictionForm";
import PredictionHistory from "./components/PredictionHistory";
import PredictionResult from "./components/PredictionResult";
import YoloBottomBar from "./components/AboutYolo";

import {
  useApiHealth,
} from "./hooks/useApiHealth";

import {
  useImagePreview,
} from "./hooks/useImagePreview";

import {
  usePredictionHistory,
} from "./hooks/usePredictionHistory";

import {
  useYoloModels,
} from "./hooks/useYoloModels";

import {
  hasValidationErrors,
  validateImageFile,
  validatePredictionInput,
} from "./utils/validation";

import "./App.css";


const PREDICTION_TIMEOUT_MS = 120000;


function scrollToResultPanel() {
  window.requestAnimationFrame(() => {
    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    document
      .getElementById("result")
      ?.scrollIntoView({
        behavior: prefersReducedMotion
          ? "auto"
          : "smooth",
        block: "start",
      });
  });
}


function App() {
  const showToast = useToast();

  const predictionAbortRef =
    useRef(null);

  const {
    status: apiStatus,
    error: apiError,
    retryHealthCheck,
  } = useApiHealth();

  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    reloadModels,
  } = useYoloModels();

  const {
    history,
    addPrediction,
    removePrediction,
    clearHistory,
  } = usePredictionHistory();


  const [modelId, setModelId] =
    useState("");

  const [confidence, setConfidence] =
    useState("0.25");

  const [sahiEnabled, setSahiEnabled] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [
    predictionResult,
    setPredictionResult,
  ] = useState(null);

  const [
    predictionError,
    setPredictionError,
  ] = useState("");

  const [predicting, setPredicting] =
    useState(false);

  const [
    selectedHistoryId,
    setSelectedHistoryId,
  ] = useState("");


  const {
    previewUrl,
    updatePreview,
  } = useImagePreview();


  const modelIdIsAvailable =
    models.some(
      (model) => model.id === modelId
    );

  const resolvedModelId =
    modelIdIsAvailable
      ? modelId
      : models[0]?.id ?? "";


  function resetPrediction() {
    setPredictionResult(null);
    setPredictionError("");
    setSelectedHistoryId("");
  }


  function handleModelChange(
    nextModelId
  ) {
    setModelId(nextModelId);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        modelId: "",
      })
    );

    resetPrediction();
  }


  function handleConfidenceChange(
    nextConfidence
  ) {
    setConfidence(nextConfidence);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        confidence: "",
      })
    );

    resetPrediction();
  }


  function handleFileChange(nextFile) {
    /*
     * User กด Remove
     * หรือ Reset ไฟล์
     */
    if (!nextFile) {
      setSelectedFile(null);
      updatePreview(null);

      setFieldErrors(
        (currentErrors) => ({
          ...currentErrors,
          file: "",
        })
      );

      resetPrediction();
      return;
    }

    /*
     * ตรวจไฟล์ทันที
     */
    const fileError =
      validateImageFile(nextFile);

    if (fileError) {
      setSelectedFile(null);
      updatePreview(null);

      setFieldErrors(
        (currentErrors) => ({
          ...currentErrors,
          file: fileError,
        })
      );

      resetPrediction();
      return;
    }

    setSelectedFile(nextFile);
    updatePreview(nextFile);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        file: "",
      })
    );

    resetPrediction();
  }


  function handleReset() {
    setConfidence("0.25");
    setSelectedFile(null);

    updatePreview(null);

    setFieldErrors({});
    setPredictionResult(null);
    setPredictionError("");
    setSelectedHistoryId("");
  }


  async function handlePrediction() {
    const validationErrors =
      validatePredictionInput({
        modelId: resolvedModelId,
        confidence,
        file: selectedFile,
      });

    setFieldErrors(validationErrors);
    setPredictionError("");

    if (
      hasValidationErrors(
        validationErrors
      )
    ) {
      return;
    }

    setPredicting(true);
    setPredictionResult(null);
    setSelectedHistoryId("");

    const controller = new AbortController();
    predictionAbortRef.current = controller;

    let timedOut = false;
    const timeoutId = window.setTimeout(
      () => {
        timedOut = true;
        controller.abort();
      },
      PREDICTION_TIMEOUT_MS
    );

    try {
      const result =
        await predictUploadedImage({
          modelId: resolvedModelId,
          confidence: Number(confidence),
          file: selectedFile,
          useSahi: sahiEnabled,
          signal: controller.signal,
        });

      setPredictionResult(result);
      scrollToResultPanel();

      const selectedModel =
        models.find(
          (model) =>
            model.id === resolvedModelId
        );

      const newHistoryItem =
        addPrediction({
          result,
          sourceFile: selectedFile,
          modelName:
            selectedModel?.name ??
            resolvedModelId,
        });

      setSelectedHistoryId(
        newHistoryItem.id
      );

      showToast({
        type: "success",
        message: `Prediction complete — ${
          result.object_count
        } object${
          result.object_count === 1
            ? ""
            : "s"
        } detected.`,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        if (timedOut) {
          const timeoutMessage =
            "The prediction timed out. Please try again.";

          setPredictionError(
            timeoutMessage
          );

          showToast({
            type: "error",
            message: timeoutMessage,
          });
        }
        /*
         * ผู้ใช้กด Cancel เอง
         * ไม่ต้องแสดง error
         */
      } else {
        const message =
          error.message ||
          "Prediction request failed";

        setPredictionError(message);

        showToast({
          type: "error",
          message,
        });
      }
    } finally {
      window.clearTimeout(timeoutId);
      predictionAbortRef.current = null;
      setPredicting(false);
    }
  }


  function handleCancelPrediction() {
    predictionAbortRef.current?.abort();
  }


  /*
   * เปิดผลลัพธ์เก่าจาก History
   *
   * ไม่สามารถนำไฟล์เดิมกลับเข้า
   * <input type="file"> อัตโนมัติได้
   * ดังนั้นเปลี่ยนเฉพาะ Result Panel
   */
  function handleSelectHistory(item) {
    setPredictionResult(item.result);
    setSelectedHistoryId(item.id);
    setPredictionError("");
    scrollToResultPanel();
  }


  function handleRemoveHistory(
    historyId
  ) {
    removePrediction(historyId);

    /*
     * ถ้ากำลังเปิดรายการที่ถูกลบ
     * ให้ล้าง Result Panel ด้วย
     */
    if (
      selectedHistoryId === historyId
    ) {
      setSelectedHistoryId("");
      setPredictionResult(null);
    }

    showToast({
      type: "info",
      message: "Prediction removed from history.",
    });
  }


  function handleClearHistory() {
    clearHistory();
    setSelectedHistoryId("");
    setPredictionResult(null);

    showToast({
      type: "info",
      message: "Prediction history cleared.",
    });
  }


  return (
    <div className="app-shell">
      <AppHeader
        apiStatus={apiStatus}
        apiError={apiError}
        onRetryApi={retryHealthCheck}
      />

      <YoloBottomBar />

      <main className="main-content">
        <PredictionForm
          models={models}
          modelsLoading={modelsLoading}
          modelsError={modelsError}
          onReloadModels={reloadModels}

          modelId={resolvedModelId}
          onModelChange={
            handleModelChange
          }

          confidence={confidence}
          onConfidenceChange={
            handleConfidenceChange
          }

          sahiEnabled={sahiEnabled}
          onSahiChange={setSahiEnabled}

          selectedFile={selectedFile}
          onFileChange={
            handleFileChange
          }

          previewUrl={previewUrl}
          fieldErrors={fieldErrors}

          predictionError={
            predictionError
          }

          predicting={predicting}

          onSubmit={handlePrediction}
          onReset={handleReset}
          onCancel={handleCancelPrediction}
        />

        <div className="workflow-output">
          <PredictionResult
            key={
              selectedHistoryId ||
              predictionResult?.result_image_url ||
              (predicting
                ? "prediction-loading"
                : "prediction-empty")
            }
            result={predictionResult}
            predicting={predicting}
          />

          <PredictionHistory
            items={history}
            selectedId={
              selectedHistoryId
            }
            onSelect={
              handleSelectHistory
            }
            onRemove={
              handleRemoveHistory
            }
            onClear={
              handleClearHistory
            }
          />

        </div>
      </main>
    </div>
  );
}


export default App;
