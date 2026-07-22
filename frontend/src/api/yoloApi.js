const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000"
).replace(/\/$/, "");


function getErrorMessage(data, statusCode) {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg ?? JSON.stringify(item))
      .join(", ");
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  return `Request failed with status ${statusCode}`;
}


async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") ?? "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const responseText = await response.text();

    data = {
      detail:
        responseText ||
        `Request failed with status ${response.status}`,
    };
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, response.status)
    );
  }

  return data;
}


export async function getApiHealth({
  signal,
} = {}) {
  const response = await fetch(
    `${API_BASE_URL}/health`,
    {
      method: "GET",
      signal,
    }
  );

  return readResponse(response);
}


export async function getAvailableModels({
  signal,
} = {}) {
  const response = await fetch(
    `${API_BASE_URL}/api/models`,
    {
      method: "GET",
      signal,
    }
  );

  return readResponse(response);
}


export async function predictUploadedImage({
  modelId,
  confidence,
  file,
  useSahi = false,
  signal,
}) {
  const formData = new FormData();

  formData.append("model_id", modelId);
  formData.append(
    "confidence",
    String(confidence)
  );
  formData.append(
    "use_sahi",
    String(useSahi)
  );
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/predict`,
    {
      method: "POST",
      body: formData,
      signal,
    }
  );

  return readResponse(response);
}