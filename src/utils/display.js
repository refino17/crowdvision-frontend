const TITLE_CASE_EXCEPTIONS = new Set(["ai", "ip", "rtsp", "usb", "cctv", "url", "fps", "id"]);

function toTitleCase(value = "") {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (TITLE_CASE_EXCEPTIONS.has(lower)) return lower.toUpperCase();
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

export function formatSourceLabel(value) {
  if (!value) return "No Source";
  const raw = String(value).trim();
  const text = raw.toLowerCase();

  if (!raw || raw === "none" || raw === "null" || raw === "undefined") return "No Source";
  if (text.includes("uploaded_video") || text.includes("uploaded video")) return "Uploaded Video";
  if (text.includes("crowd_video") || text.includes("crowd video")) return "Crowd Video Test";
  if (text.includes("phone_camera") || text.includes("phone camera") || text.includes("droidcam")) return "Phone Camera";
  if (text.includes("usb_camera") || text.includes("usb camera")) return "USB Camera";
  if (text.includes("webcam") || text.includes("laptop camera")) return "Webcam";
  if (text.includes("rtsp") || text.includes("cctv")) return "CCTV / RTSP";
  if (text.includes("drone")) return "Drone Stream";
  if (text.includes("ip_camera") || text.includes("ip camera")) return "IP Camera";

  return toTitleCase(raw);
}

export function compactText(value, maxLength = 24) {
  const text = String(value || "").trim();
  if (!text) return "None";
  if (text.length <= maxLength) return text;
  const front = Math.max(8, Math.floor(maxLength * 0.58));
  const back = Math.max(4, maxLength - front - 1);
  return `${text.slice(0, front)}…${text.slice(-back)}`;
}

export function compactSourceLabel(value, maxLength = 24) {
  return compactText(formatSourceLabel(value), maxLength);
}

export function formatModeLabel(value) {
  if (!value) return "Auto";
  const text = String(value).toUpperCase().replace(/_/g, " ");
  if (text.includes("LOW")) return "Low";
  if (text.includes("BALANCED")) return "Balanced";
  if (text.includes("HIGH")) return "High";
  if (text.includes("ULTRA")) return "Ultra";
  if (text.includes("AUTO")) return "Auto";
  return toTitleCase(text);
}

export function formatStatusLabel(value, fallback = "Unknown") {
  if (value === true) return "Online";
  if (value === false) return "Offline";
  if (!value && value !== 0) return fallback;
  return toTitleCase(String(value));
}
