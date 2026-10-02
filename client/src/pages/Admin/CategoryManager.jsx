import { useEffect, useState } from 'react'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../api/category.api'
import { useFeedback } from '../../components/ui/FeedbackContext'

const emptyForm = { name: '', slug: '', description: '', sortOrder: 0 }
const toSlug = (value) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function CategoryManager({ onFeedback, onCategoriesChanged }) {
  const { confirm } = useFeedback()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() { setCategories(await getCategories()) }

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((reason) => setError(reason.message || 'Không tải được danh mục.'))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, slug: form.slug.trim() || toSlug(form.name), sortOrder: Number(form.sortOrder) }
      if (editingId) await updateCategory(editingId, payload)
      else await createCategory(payload)
      await reload()
      await onCategoriesChanged?.()
      setForm(emptyForm)
      setEditingId('')
      onFeedback('success', 'Đã lưu danh mục.')
    } catch (reason) { setError(reason.response?.data?.message || reason.message || 'Không thể lưu danh mục.') }
    finally { setSaving(false) }
  }

  async function archive(category) {
    const accepted = await confirm({
      title: 'Ẩn danh mục?',
      description: `“${category.name}” sẽ không còn hiển thị trong cửa hàng.`,
      confirmLabel: 'Ẩn danh mục',
    })
    if (!accepted) return
    try {
      await deleteCategory(category._id)
      await reload()
      await onCategoriesChanged?.()
    } catch (reason) { setError(reason.response?.data?.message || reason.message || 'Không thể ẩn danh mục.') }
  }

  return <section className="admin-section">
    <div className="dashboard-toolbar"><h2>Danh mục sản phẩm <span>{categories.length}</span></h2></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <form className="product-form category-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Tên danh mục<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: editingId ? form.slug : toSlug(event.target.value) })} required maxLength={100}/></label>
        <label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required maxLength={120}/></label>
        <label className="field-wide">Mô tả<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={1000}/></label>
      </div>
      <div className="dashboard-actions"><button disabled={saving}>{editingId ? 'Lưu danh mục' : 'Thêm danh mục'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm) }}>Hủy</button>}</div>
    </form>
    <div className="category-admin-list">{categories.map((category) => <article key={category._id}><div><strong>{category.name}</strong><small>/{category.slug} · {category.isActive ? 'Đang hiển thị' : 'Đã ẩn'}</small></div><div className="dashboard-actions"><button onClick={() => { setEditingId(category._id); setForm({ name: category.name, slug: category.slug, description: category.description || '', sortOrder: category.sortOrder || 0 }) }}>Sửa</button><button onClick={() => archive(category)}>Ẩn</button></div></article>)}</div>
  </section>
}
