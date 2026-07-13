import { useEffect, useRef, useState } from 'react'
import { createCategory, deleteCategory } from '../api'
import { UNCATEGORIZED_LABEL } from '../utils/categories'

const DEFAULT_COLOR = '#4287f5'

function CategoryManagerModal({
  categories,
  onClose,
  onCategoryAdded,
  onCategoryDeleted,
  onCategoriesChanged,
}) {
  const nameInputRef = useRef(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLOR)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setIsAdding(true)
    setAddError('')
    try {
      const created = await createCategory({ name, color: newColor })
      setNewName('')
      // Update local state immediately from the create response — don't make
      // the new category's appearance depend on a second network round-trip.
      onCategoryAdded(created?.id != null ? created : { id: `temp-${Date.now()}`, name, color: newColor })
      // Best-effort reconciliation with the server in the background; if this
      // fails the optimistic update above still stands, so the UI is correct
      // either way.
      onCategoriesChanged().catch((err) =>
        console.error('Failed to reconcile categories after add:', err),
      )
      nameInputRef.current?.focus()
    } catch (err) {
      setAddError(
        err.status === 409 ? `A category named "${name}" already exists.` : err.message,
      )
    } finally {
      setIsAdding(false)
    }
  }

  async function handleConfirmDelete(category) {
    setDeletingId(category.id)
    setDeleteError('')
    try {
      await deleteCategory(category.id)
      setConfirmingId(null)
      // Same reasoning as add: update local state immediately, don't gate the
      // UI on the follow-up refetch succeeding.
      onCategoryDeleted(category.id)
      onCategoriesChanged().catch((err) =>
        console.error('Failed to reconcile after delete:', err),
      )
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Manage categories"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Manage categories</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <ul className="category-manage-list">
          {categories.map((c) => (
            <li key={c.id} className="category-manage-row">
              <span className="legend-swatch" style={{ background: c.color }} />
              <span className="category-manage-name">{c.name}</span>

              {c.name === UNCATEGORIZED_LABEL ? (
                <span className="category-manage-protected">Can't be deleted</span>
              ) : confirmingId === c.id ? (
                <span className="category-manage-confirm">
                  <span className="category-manage-confirm-text">Move transactions & delete?</span>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={deletingId === c.id}
                    onClick={() => handleConfirmDelete(c)}
                  >
                    {deletingId === c.id ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button type="button" className="btn-plain" onClick={() => setConfirmingId(null)}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-plain category-manage-delete"
                  onClick={() => {
                    setConfirmingId(c.id)
                    setDeleteError('')
                  }}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>

        {deleteError && <p className="form-error">{deleteError}</p>}

        <form className="category-add-form" onSubmit={handleAdd}>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            aria-label="Category color"
          />
          <button type="submit" className="btn-primary" disabled={isAdding || !newName.trim()}>
            {isAdding ? 'Adding…' : 'Add category'}
          </button>
        </form>
        {addError && <p className="form-error">{addError}</p>}
      </div>
    </div>
  )
}

export default CategoryManagerModal
