import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import SectionHead from "../components/common/SectionHead";
import "../styles/evidence-v37.css";

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function titleFromFilename(filename = "") {
  const base = String(filename || "Evidence snapshot")
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/_/g, " ")
    .trim();

  return base || "Evidence snapshot";
}

function levelFromFilename(filename = "") {
  const lower = String(filename).toLowerCase();
  if (lower.includes("critical")) return "Critical";
  if (lower.includes("high")) return "High";
  return "Captured";
}

function levelClass(level = "") {
  const safe = String(level).toLowerCase();
  if (safe === "critical") return "is-critical";
  if (safe === "high") return "is-high";
  return "is-captured";
}

function snapshotDateLabel(value) {
  if (!value) return "Unknown capture time";
  return String(value);
}

function EvidenceLightbox({ item, index, total, onClose, onPrevious, onNext }) {
  if (!item) return null;

  const level = levelFromFilename(item.filename);
  const safeTitle = titleFromFilename(item.filename);

  return createPortal(
    <div className="ev37-lightbox" role="presentation" onMouseDown={onClose}>
      <section
        className="ev37-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence image preview"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ev37-viewer-header">
          <div className="ev37-viewer-title-block">
            <span className="ev37-kicker">Evidence Preview</span>
            <h2>{safeTitle}</h2>
            <p>{index + 1} of {total} captured snapshots</p>
          </div>

          <div className="ev37-viewer-actions">
            <button type="button" onClick={onPrevious} aria-label="Previous evidence image">
              ← Previous
            </button>
            <button type="button" onClick={onNext} aria-label="Next evidence image">
              Next →
            </button>
            {item.url && (
              <a href={item.url} download={item.filename} target="_blank" rel="noreferrer">
                Download Image
              </a>
            )}
            <button type="button" className="ev37-close-button" onClick={onClose} aria-label="Close evidence preview">
              Close
            </button>
          </div>
        </header>

        <div className="ev37-viewer-main">
          <figure className="ev37-image-stage">
            {item.url ? (
              <img src={item.url} alt={item.filename || "Evidence snapshot"} />
            ) : (
              <div className="ev37-no-image">No image available</div>
            )}
          </figure>

          <aside className="ev37-inspector" aria-label="Evidence details">
            <div className={`ev37-status-card ${levelClass(level)}`}>
              <span>Evidence Status</span>
              <strong>{level} Snapshot</strong>
            </div>

            <div className="ev37-detail-list">
              <div>
                <span>File Name</span>
                <strong>{item.filename || "Unknown file"}</strong>
              </div>
              <div>
                <span>Captured</span>
                <strong>{snapshotDateLabel(item.created)}</strong>
              </div>
              <div>
                <span>File Size</span>
                <strong>{formatBytes(item.size)}</strong>
              </div>
              <div>
                <span>Evidence Type</span>
                <strong>Visual Snapshot</strong>
              </div>
            </div>

            <div className="ev37-help-card">
              <span>Review Controls</span>
              <p>Use the Previous and Next buttons, or press the left and right arrow keys. Press Esc to close.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default function EvidencePage({ data }) {
  const { evidence, fetchDashboardData } = data;
  const [selectedIndex, setSelectedIndex] = useState(null);

  const gallery = useMemo(() => {
    return Array.isArray(evidence) ? evidence.filter(Boolean) : [];
  }, [evidence]);

  const selectedItem = selectedIndex !== null ? gallery[selectedIndex] : null;

  function openLightbox(index) {
    setSelectedIndex(index);
  }

  function closeLightbox() {
    setSelectedIndex(null);
  }

  function showPrevious() {
    setSelectedIndex((current) => {
      if (current === null || gallery.length < 1) return current;
      return current === 0 ? gallery.length - 1 : current - 1;
    });
  }

  function showNext() {
    setSelectedIndex((current) => {
      if (current === null || gallery.length < 1) return current;
      return current === gallery.length - 1 ? 0 : current + 1;
    });
  }

  useEffect(() => {
    if (selectedIndex === null) return undefined;

    document.body.classList.add("ev37-modal-open");

    function handleKeyDown(event) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("ev37-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, gallery.length]);

  const criticalCount = gallery.filter((item) => levelFromFilename(item.filename) === "Critical").length;
  const highCount = gallery.filter((item) => levelFromFilename(item.filename) === "High").length;

  return (
    <>
      <section className="page-title-panel ev37-hero-panel">
        <p className="section-kicker">Evidence Gallery</p>
        <h1>Evidence Snapshots</h1>
        <p>Review alert snapshots and visual evidence captured during high-risk crowd events.</p>
      </section>

      <section className="panel ev37-gallery-panel">
        <SectionHead
          kicker="Evidence Center"
          title="Snapshot Gallery"
          action={<button type="button" onClick={fetchDashboardData}>Refresh</button>}
        />

        <div className="ev37-summary-row" aria-label="Evidence summary">
          <div>
            <span>Total Snapshots</span>
            <strong>{gallery.length}</strong>
          </div>
          <div>
            <span>High Snapshots</span>
            <strong>{highCount}</strong>
          </div>
          <div>
            <span>Critical Snapshots</span>
            <strong>{criticalCount}</strong>
          </div>
        </div>

        <div className="ev37-grid">
          {gallery.slice(0, 80).map((item, index) => {
            const level = levelFromFilename(item.filename);

            return (
              <button
                type="button"
                className="ev37-card"
                key={`${item.filename}-${index}`}
                onClick={() => openLightbox(index)}
                aria-label={`Open evidence snapshot ${item.filename}`}
              >
                <span className={`ev37-card-level ${levelClass(level)}`}>{level}</span>

                <span className="ev37-card-image">
                  {item.url ? (
                    <img src={item.url} alt={item.filename || "Evidence snapshot"} loading="lazy" />
                  ) : (
                    <span className="ev37-no-image">No preview</span>
                  )}
                </span>

                <span className="ev37-card-body">
                  <span className="ev37-card-title">{item.filename || "Evidence snapshot"}</span>
                  <span className="ev37-card-meta">
                    <span>{snapshotDateLabel(item.created)}</span>
                    <span>{formatBytes(item.size)}</span>
                  </span>
                </span>
              </button>
            );
          })}

          {gallery.length === 0 && (
            <div className="empty-state ev37-empty-state">
              <h3>No evidence snapshots yet</h3>
              <p>High and Critical evidence snapshots will appear here when CrowdVision captures them.</p>
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <EvidenceLightbox
          item={selectedItem}
          index={selectedIndex}
          total={gallery.length}
          onClose={closeLightbox}
          onPrevious={showPrevious}
          onNext={showNext}
        />
      )}
    </>
  );
}
