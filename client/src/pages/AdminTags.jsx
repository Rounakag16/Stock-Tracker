import { useEffect, useState } from "react";
import { Modal, Alert, LoadingSpinner, EmptyState } from "../components/ui";
import { get, post, patch, del } from "../lib/api";

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#16a34a",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

// Light tinted background from a hex color, so a chip reads as "colored"
// without needing a second stored value or a contrast calculation — the
// tag's own hex is used as-is for the text/border, which stays legible
// against a low-alpha tint of the same color.
function tint(hex, alpha) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

function TagChip({ tag }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: tint(tag.color, 0.14), color: tag.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
      {tag.name}
    </span>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          className={`w-8 h-8 rounded-full transition-transform ${value === hex ? "ring-2 ring-offset-2 ring-ink scale-110" : "hover:scale-110"}`}
          style={{ backgroundColor: hex }}
          aria-label={hex}
        />
      ))}
    </div>
  );
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[8]);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PALETTE[8]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const loadTags = () => {
    get("/tags").then(({ ok, data }) => {
      if (ok) setTags(data.tags || []);
      setLoading(false);
    });
  };

  useEffect(loadTags, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAddError("");
    if (!newName.trim()) return;

    setAddSubmitting(true);
    const { ok, data } = await post("/tags", { name: newName.trim(), color: newColor });
    setAddSubmitting(false);

    if (!ok) {
      setAddError(data.error);
      return;
    }
    setTags((prev) => [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
    setNewName("");
    setNewColor(PALETTE[8]);
  }

  function openEdit(tag) {
    setEditTarget(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
    setEditError("");
  }

  async function handleEdit(e) {
    e.preventDefault();
    setEditError("");
    if (!editName.trim()) return;

    setEditSubmitting(true);
    const { ok, data } = await patch(`/tags/${editTarget.id}`, { name: editName.trim(), color: editColor });
    setEditSubmitting(false);

    if (!ok) {
      setEditError(data.error);
      return;
    }
    setTags((prev) => prev.map((t) => (t.id === editTarget.id ? data.tag : t)).sort((a, b) => a.name.localeCompare(b.name)));
    setSuccess("Tag updated");
    setEditTarget(null);
  }

  async function handleDelete(tag) {
    if (!confirm(`Delete the "${tag.name}" tag? It will be removed from every item currently using it.`)) return;

    const { ok, data } = await del(`/tags/${tag.id}`);
    if (!ok) {
      setError(data.error);
      return;
    }
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    setSuccess(
      data.itemsUpdated > 0
        ? `Tag deleted and removed from ${data.itemsUpdated} item${data.itemsUpdated === 1 ? "" : "s"}`
        : "Tag deleted"
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container max-w-2xl">
      <div className="admin-page-header flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Tags</h1>
          <p className="text-slate-500 mt-1">Manage the tags used to organize stock items</p>
        </div>
        <button onClick={() => { setShowAdd(true); setAddError(""); }} className="btn-primary shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Tag
        </button>
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onDismiss={() => setSuccess("")} /></div>}
      {error && <div className="mb-4"><Alert type="error" message={error} onDismiss={() => setError("")} /></div>}

      {tags.length === 0 ? (
        <EmptyState title="No tags yet" description="Create a tag to start organizing stock items by category" />
      ) : (
        <div className="card divide-y divide-line">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-3 p-4">
              <TagChip tag={tag} />
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(tag)} className="btn-secondary text-xs py-1.5 px-3 min-h-0">
                  Edit
                </button>
                <button onClick={() => handleDelete(tag)} className="btn-danger text-xs py-1.5 px-3 min-h-0">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Tag">
        <form onSubmit={handleAdd} className="space-y-4">
          {addError && <Alert type="error" message={addError} />}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Electronics" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Preview</p>
            <TagChip tag={{ name: newName || "Tag name", color: newColor }} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={addSubmitting || !newName.trim()}>
            {addSubmitting ? "Creating..." : "Create Tag"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Tag">
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && <Alert type="error" message={editError} />}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
              <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <p className="text-xs text-slate-500 mt-1.5">Renaming updates every item currently using this tag.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Preview</p>
              <TagChip tag={{ name: editName || "Tag name", color: editColor }} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={editSubmitting || !editName.trim()}>
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
