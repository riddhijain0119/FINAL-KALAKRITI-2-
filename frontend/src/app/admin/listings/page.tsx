'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api, fetchContent, Me,
  CmsMedium, CmsHeroItem, CmsGalleryItem, CmsPricing,
} from '@/lib/api';
import AppLogo from '@/components/ui/AppLogo';
import {
  ArrowLeft, Save, Plus, Trash2, Upload, RotateCcw,
  Image as ImageIcon, LayoutGrid, Sparkles, IndianRupee, Megaphone, FileText,
} from 'lucide-react';

type SectionKey = 'mediums' | 'hero' | 'gallery' | 'pricing' | 'banner' | 'site_text';

const SECTIONS: { key: SectionKey; label: string; icon: any; desc: string }[] = [
  { key: 'mediums', label: 'Mediums', icon: Sparkles, desc: 'Cards on home page (Watercolour, Pencil, Oil, Charcoal…)' },
  { key: 'hero',    label: 'Hero',    icon: ImageIcon, desc: 'Before/After transformations on the homepage hero' },
  { key: 'gallery', label: 'Gallery', icon: LayoutGrid, desc: 'Gallery page items (image, title, medium, size)' },
  { key: 'pricing', label: 'Pricing', icon: IndianRupee, desc: 'Base prices, size multipliers, frame costs, GST' },
  { key: 'banner',  label: 'Campaign Banner', icon: Megaphone, desc: 'Site-wide promo banner shown above every page' },
  { key: 'site_text', label: 'Site Text', icon: FileText, desc: 'Headline, policies, contact info, footer text' },
];

export default function AdminListingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [active, setActive] = useState<SectionKey>('mediums');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await api<Me>('/api/auth/me');
        if (u.role !== 'admin') { router.replace('/my-orders'); return; }
        setMe(u);
      } catch { router.replace('/login'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-[#2C1810] text-[#FAF6F0] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-2" data-testid="back-to-admin-link">
          <ArrowLeft size={16} className="text-[#E8C96A]" />
          <AppLogo size={32} className="bg-[#FAF6F0] rounded-full p-1" />
          <div>
            <p className="font-display text-xl leading-none">Kalakriti</p>
            <p className="text-xs text-[#E8C96A] tracking-widest uppercase">Listings &amp; Content</p>
          </div>
        </Link>
        <span className="text-sm text-[#E0D5C8]" data-testid="admin-email">{me?.email}</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" data-testid="cms-tabs">
          {SECTIONS.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              data-testid={`tab-${key}`}
              className={`p-4 rounded-sm border text-left transition-all ${
                active === key
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 shadow-luxury'
                  : 'border-[#E0D5C8] bg-[#FFFDF9] hover:border-[#C9A84C]/40'
              }`}
            >
              <Icon size={18} className={active === key ? 'text-[#C9A84C]' : 'text-[#9C8878]'} />
              <p className="font-display text-lg text-[#2C1810] mt-2">{label}</p>
              <p className="text-xs text-[#9C8878] leading-relaxed mt-1 line-clamp-2">{desc}</p>
            </button>
          ))}
        </div>

        {active === 'mediums' && <MediumsEditor />}
        {active === 'hero'    && <HeroEditor />}
        {active === 'gallery' && <GalleryEditor />}
        {active === 'pricing' && <PricingEditor />}
        {active === 'banner'  && <BannerEditor />}
        {active === 'site_text' && <SiteTextEditor />}
      </div>
    </main>
  );
}

// ----- helpers -----
async function uploadImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB');
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
  const res = await api<{ url: string }>('/api/admin/cms-image', {
    method: 'POST', body: JSON.stringify({ data }),
  });
  return res.url;
}

function ImageField({ value, onChange, label, testid }:
  { value: string; onChange: (v: string) => void; label?: string; testid?: string }) {
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(f);
      onChange(url);
    } catch (err: any) { alert(err?.message || 'Upload failed'); }
    finally { setBusy(false); if (inp.current) inp.current.value = ''; }
  };
  return (
    <div className="space-y-1.5">
      {label && <span className="block text-xs font-body text-[#9C8878] uppercase tracking-widest">{label}</span>}
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8] overflow-hidden flex items-center justify-center flex-shrink-0">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#9C8878]" />}
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/path or https://..."
            className="w-full px-3 py-2 text-sm rounded-sm border border-[#E0D5C8] bg-white"
            data-testid={testid}
          />
          <button
            type="button"
            onClick={() => inp.current?.click()}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-sm bg-[#2C1810] text-[#FAF6F0] hover:bg-[#1A0E09] disabled:opacity-50 inline-flex items-center gap-1.5"
            data-testid={testid ? `${testid}-upload` : undefined}
          >
            <Upload size={12}/> {busy ? 'Uploading…' : 'Upload image'}
          </button>
          <input ref={inp} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, onSave, onReset, saving, children }:
  { title: string; onSave: () => void; onReset: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-6 shadow-luxury">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="font-display text-3xl text-[#2C1810]">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onReset} className="text-xs px-3 py-2 rounded-sm border border-[#E0D5C8] text-[#3D3530] inline-flex items-center gap-1.5 hover:bg-[#FAF6F0]" data-testid="cms-reset-btn">
            <RotateCcw size={12}/> Reset to defaults
          </button>
          <button onClick={onSave} disabled={saving} className="text-sm px-5 py-2 rounded-sm bg-[#C9A84C] text-[#2C1810] hover:bg-[#E8C96A] inline-flex items-center gap-1.5 disabled:opacity-60" data-testid="cms-save-btn">
            <Save size={14}/> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, testid }: { label: string; children: React.ReactNode; testid?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-body text-[#9C8878] uppercase tracking-widest mb-1.5">{label}</span>
      <div data-testid={testid}>{children}</div>
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-sm border border-[#E0D5C8] bg-white';

// ===== Mediums Editor =====
function MediumsEditor() {
  const [items, setItems] = useState<CmsMedium[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchContent<{ items: CmsMedium[] }>('mediums');
    setItems(data.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (i: number, patch: Partial<CmsMedium>) =>
    setItems(items.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, {
    id: `medium-${Date.now()}`, key: `key-${Date.now()}`,
    name: 'New Medium', tagline: '', description: '',
    image: '', image_alt: '', starting_price: 0, turnaround: '', tag: '', tag_color: '',
  }]);
  const save = async () => {
    setSaving(true);
    try { await api('/api/admin/content/mediums', { method: 'PUT', body: JSON.stringify({ data: { items } }) }); alert('Saved'); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm('Reset Mediums to defaults? Your changes will be lost.')) return;
    await api('/api/admin/content/mediums/reset', { method: 'POST' });
    await load();
  };

  if (loading) return <div className="text-center text-[#9C8878] py-10">Loading…</div>;

  return (
    <SectionShell title="Mediums" onSave={save} onReset={reset} saving={saving}>
      <p className="text-sm text-[#9C8878] mb-4">These cards appear on the home page (&quot;Choose Your Medium&quot;).</p>
      <div className="space-y-4">
        {items.map((m, i) => (
          <div key={m.id} className="border border-[#E0D5C8] rounded-sm p-4 bg-[#FAF6F0]/40" data-testid={`medium-row-${i}`}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-display text-lg text-[#2C1810]">{m.name || 'Untitled'}</p>
              <button onClick={() => remove(i)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-sm" data-testid={`medium-remove-${i}`}><Trash2 size={14}/></button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Name"><input className={inputCls} value={m.name} onChange={(e) => update(i, { name: e.target.value })} data-testid={`medium-name-${i}`}/></Field>
              <Field label="Internal key (lowercase, no spaces)"><input className={inputCls} value={m.key} onChange={(e) => update(i, { key: e.target.value })} /></Field>
              <Field label="Tagline"><input className={inputCls} value={m.tagline} onChange={(e) => update(i, { tagline: e.target.value })} /></Field>
              <Field label="Tag (e.g. Most Popular)"><input className={inputCls} value={m.tag} onChange={(e) => update(i, { tag: e.target.value })} /></Field>
              <Field label="Starting Price (₹)"><input type="number" className={inputCls} value={m.starting_price} onChange={(e) => update(i, { starting_price: Number(e.target.value) })} /></Field>
              <Field label="Turnaround"><input className={inputCls} value={m.turnaround} onChange={(e) => update(i, { turnaround: e.target.value })} /></Field>
              <div className="md:col-span-2">
                <Field label="Description"><textarea rows={2} className={inputCls} value={m.description} onChange={(e) => update(i, { description: e.target.value })} /></Field>
              </div>
              <div className="md:col-span-2">
                <ImageField label="Image" value={m.image} onChange={(v) => update(i, { image: v })} testid={`medium-image-${i}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 px-4 py-2 text-sm rounded-sm bg-[#2C1810] text-[#FAF6F0] hover:bg-[#1A0E09] inline-flex items-center gap-1.5" data-testid="medium-add">
        <Plus size={14}/> Add medium
      </button>
    </SectionShell>
  );
}

// ===== Hero Editor =====
function HeroEditor() {
  const [items, setItems] = useState<CmsHeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchContent<{ items: CmsHeroItem[] }>('hero');
    setItems(data.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (i: number, patch: Partial<CmsHeroItem>) =>
    setItems(items.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, {
    id: `transform-${Date.now()}`, before: '', before_alt: '', after: '', after_alt: '',
    medium: '', turnaround: '', size: '',
  }]);
  const save = async () => {
    setSaving(true);
    try { await api('/api/admin/content/hero', { method: 'PUT', body: JSON.stringify({ data: { items } }) }); alert('Saved'); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm('Reset Hero to defaults?')) return;
    await api('/api/admin/content/hero/reset', { method: 'POST' });
    await load();
  };

  if (loading) return <div className="text-center text-[#9C8878] py-10">Loading…</div>;

  return (
    <SectionShell title="Hero Transformations" onSave={save} onReset={reset} saving={saving}>
      <p className="text-sm text-[#9C8878] mb-4">Before/After slider entries on the homepage hero.</p>
      <div className="space-y-4">
        {items.map((h, i) => (
          <div key={h.id} className="border border-[#E0D5C8] rounded-sm p-4 bg-[#FAF6F0]/40" data-testid={`hero-row-${i}`}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-display text-lg text-[#2C1810]">{h.medium || 'Untitled'}</p>
              <button onClick={() => remove(i)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-sm"><Trash2 size={14}/></button>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Medium"><input className={inputCls} value={h.medium} onChange={(e) => update(i, { medium: e.target.value })} /></Field>
              <Field label="Size"><input className={inputCls} value={h.size} onChange={(e) => update(i, { size: e.target.value })} /></Field>
              <Field label="Turnaround"><input className={inputCls} value={h.turnaround} onChange={(e) => update(i, { turnaround: e.target.value })} /></Field>
              <div className="md:col-span-3 grid md:grid-cols-2 gap-3">
                <ImageField label="Before image" value={h.before} onChange={(v) => update(i, { before: v })} testid={`hero-before-${i}`} />
                <ImageField label="After image"  value={h.after}  onChange={(v) => update(i, { after: v })}  testid={`hero-after-${i}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 px-4 py-2 text-sm rounded-sm bg-[#2C1810] text-[#FAF6F0] hover:bg-[#1A0E09] inline-flex items-center gap-1.5">
        <Plus size={14}/> Add transformation
      </button>
    </SectionShell>
  );
}

// ===== Gallery Editor =====
function GalleryEditor() {
  const [items, setItems] = useState<CmsGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchContent<{ items: CmsGalleryItem[] }>('gallery');
    setItems(data.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (i: number, patch: Partial<CmsGalleryItem>) =>
    setItems(items.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, {
    id: `g-${Date.now()}`, title: 'New Item', medium: 'Watercolour', size: '', image: '', alt: '', tag: '',
  }]);
  const save = async () => {
    setSaving(true);
    try { await api('/api/admin/content/gallery', { method: 'PUT', body: JSON.stringify({ data: { items } }) }); alert('Saved'); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm('Reset Gallery to defaults?')) return;
    await api('/api/admin/content/gallery/reset', { method: 'POST' });
    await load();
  };

  if (loading) return <div className="text-center text-[#9C8878] py-10">Loading…</div>;

  return (
    <SectionShell title="Gallery" onSave={save} onReset={reset} saving={saving}>
      <p className="text-sm text-[#9C8878] mb-4">Items shown on the public Gallery page.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((g, i) => (
          <div key={g.id} className="border border-[#E0D5C8] rounded-sm p-4 bg-[#FAF6F0]/40" data-testid={`gallery-row-${i}`}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-display text-base text-[#2C1810]">{g.title || 'Untitled'}</p>
              <button onClick={() => remove(i)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-sm"><Trash2 size={14}/></button>
            </div>
            <div className="space-y-3">
              <Field label="Title"><input className={inputCls} value={g.title} onChange={(e) => update(i, { title: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Medium"><input className={inputCls} value={g.medium} onChange={(e) => update(i, { medium: e.target.value })} /></Field>
                <Field label="Size"><input className={inputCls} value={g.size} onChange={(e) => update(i, { size: e.target.value })} /></Field>
              </div>
              <Field label="Tag (optional)"><input className={inputCls} value={g.tag} onChange={(e) => update(i, { tag: e.target.value })} /></Field>
              <ImageField label="Image" value={g.image} onChange={(v) => update(i, { image: v })} testid={`gallery-image-${i}`} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 px-4 py-2 text-sm rounded-sm bg-[#2C1810] text-[#FAF6F0] hover:bg-[#1A0E09] inline-flex items-center gap-1.5">
        <Plus size={14}/> Add item
      </button>
    </SectionShell>
  );
}

// ===== Pricing Editor =====
function PricingEditor() {
  const [data, setData] = useState<CmsPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await fetchContent<CmsPricing>('pricing');
    setData(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try { await api('/api/admin/content/pricing', { method: 'PUT', body: JSON.stringify({ data }) }); alert('Saved'); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm('Reset Pricing to defaults?')) return;
    await api('/api/admin/content/pricing/reset', { method: 'POST' });
    await load();
  };

  if (loading || !data) return <div className="text-center text-[#9C8878] py-10">Loading…</div>;

  const KVTable = ({ label, obj, onChange, isFloat = false }:
    { label: string; obj: Record<string, number>; onChange: (next: Record<string, number>) => void; isFloat?: boolean }) => (
    <div>
      <p className="text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">{label}</p>
      <div className="border border-[#E0D5C8] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(obj).map(([k, v]) => (
              <tr key={k} className="border-b border-[#E0D5C8] last:border-0">
                <td className="px-3 py-2 font-mono text-xs text-[#3D3530] bg-[#FAF6F0]/60">{k}</td>
                <td className="px-3 py-2">
                  <input type="number" step={isFloat ? '0.01' : '1'} value={v}
                    onChange={(e) => onChange({ ...obj, [k]: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm rounded-sm border border-[#E0D5C8] bg-white"
                    data-testid={`price-${label.replace(/\s/g,'-').toLowerCase()}-${k}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <SectionShell title="Pricing" onSave={save} onReset={reset} saving={saving}>
      <p className="text-sm text-[#9C8878] mb-4">Edit base prices, multipliers, and surcharges. The portrait configurator and homepage will use these values.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <KVTable label="Base price (₹)" obj={data.medium_base_prices} onChange={(o) => setData({ ...data, medium_base_prices: o })} />
        <KVTable label="Size multipliers" obj={data.size_multipliers} onChange={(o) => setData({ ...data, size_multipliers: o })} isFloat />
        <KVTable label="Frame costs (₹)" obj={data.frame_costs} onChange={(o) => setData({ ...data, frame_costs: o })} />
        <KVTable label="Medium days" obj={data.medium_days} onChange={(o) => setData({ ...data, medium_days: o })} />
        <KVTable label="Add-on prices (₹)" obj={data.addon_prices} onChange={(o) => setData({ ...data, addon_prices: o })} />
        <div>
          <p className="text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">Globals</p>
          <Field label="GST rate (e.g. 0.18 = 18%)">
            <input type="number" step="0.01" className={inputCls} value={data.gst_rate}
              onChange={(e) => setData({ ...data, gst_rate: Number(e.target.value) })}
              data-testid="price-gst" />
          </Field>
          <div className="mt-3" />
          <Field label="Rush delivery surcharge (e.g. 0.35 = 35%)">
            <input type="number" step="0.01" className={inputCls} value={data.rush_delivery_surcharge}
              onChange={(e) => setData({ ...data, rush_delivery_surcharge: Number(e.target.value) })}
              data-testid="price-rush" />
          </Field>
        </div>
      </div>
    </SectionShell>
  );
}

// ===== Banner Editor =====
interface CmsBanner {
  enabled: boolean;
  text: string;
  link: string;
  bg_color: string;
  text_color: string;
  starts_at: string;
  ends_at: string;
}

function BannerEditor() {
  const [b, setB] = useState<CmsBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchContent<CmsBanner>('banner');
    setB(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!b) return;
    setSaving(true);
    try { await api('/api/admin/content/banner', { method: 'PUT', body: JSON.stringify({ data: b }) }); alert('Saved'); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm('Reset banner to defaults?')) return;
    await api('/api/admin/content/banner/reset', { method: 'POST' });
    await load();
  };
  const u = (k: keyof CmsBanner, v: any) => b && setB({ ...b, [k]: v });

  if (loading || !b) return <div className="text-center text-[#9C8878] py-10">Loading…</div>;

  return (
    <SectionShell title="Campaign Banner" onSave={save} onReset={reset} saving={saving}>
      <p className="text-sm text-[#9C8878] mb-5">A site-wide promo banner shown above every page (homepage, gallery, configurator, etc.). Toggle off to hide.</p>

      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-[#FAF6F0] rounded-sm border border-[#E0D5C8]">
          <input type="checkbox" id="banner-enabled" checked={b.enabled} onChange={(e) => u('enabled', e.target.checked)} data-testid="banner-enabled"/>
          <label htmlFor="banner-enabled" className="text-sm font-body text-[#3D3530]">Show banner on the live site</label>
        </div>

        <Field label="Banner text">
          <input className={inputCls} value={b.text} onChange={(e) => u('text', e.target.value)} placeholder="🎉 Diwali Sale — 20% off…" data-testid="banner-text"/>
        </Field>

        <Field label="Link (where banner clicks go)">
          <input className={inputCls} value={b.link} onChange={(e) => u('link', e.target.value)} placeholder="/portrait-configurator or full URL" data-testid="banner-link"/>
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Background color (hex)">
            <div className="flex items-center gap-2">
              <input type="color" value={b.bg_color} onChange={(e) => u('bg_color', e.target.value)} className="h-10 w-14 rounded-sm border border-[#E0D5C8]"/>
              <input className={inputCls} value={b.bg_color} onChange={(e) => u('bg_color', e.target.value)} data-testid="banner-bg"/>
            </div>
          </Field>
          <Field label="Text color (hex)">
            <div className="flex items-center gap-2">
              <input type="color" value={b.text_color} onChange={(e) => u('text_color', e.target.value)} className="h-10 w-14 rounded-sm border border-[#E0D5C8]"/>
              <input className={inputCls} value={b.text_color} onChange={(e) => u('text_color', e.target.value)} data-testid="banner-text-color"/>
            </div>
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Starts at (optional)">
            <input type="datetime-local" className={inputCls} value={(b.starts_at || '').slice(0,16)} onChange={(e) => u('starts_at', e.target.value ? new Date(e.target.value).toISOString() : '')}/>
          </Field>
          <Field label="Ends at (optional)">
            <input type="datetime-local" className={inputCls} value={(b.ends_at || '').slice(0,16)} onChange={(e) => u('ends_at', e.target.value ? new Date(e.target.value).toISOString() : '')}/>
          </Field>
        </div>

        <div>
          <p className="text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">Live preview</p>
          <div className="rounded-sm py-3 px-5 text-center text-sm font-body" style={{ backgroundColor: b.bg_color, color: b.text_color }} data-testid="banner-preview">
            {b.text || 'Banner text will appear here'}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

// ===== Site Text Editor =====
const TEXT_FIELDS: { key: string; label: string; type: 'short' | 'long'; help?: string }[] = [
  { key: 'brand_name',       label: 'Brand name', type: 'short' },
  { key: 'brand_tagline',    label: 'Brand tagline (eyebrow)', type: 'short', help: 'Small text above hero headline' },
  { key: 'hero_headline',    label: 'Hero headline (first part)', type: 'short' },
  { key: 'hero_headline_em', label: 'Hero headline (italic gold part)', type: 'short' },
  { key: 'hero_subtext',     label: 'Hero subtext', type: 'long' },
  { key: 'cta_primary',      label: 'Primary CTA button', type: 'short' },
  { key: 'cta_secondary',    label: 'Secondary CTA button', type: 'short' },
  { key: 'about_title',      label: 'About section title', type: 'short' },
  { key: 'about_body',       label: 'About section body', type: 'long' },
  { key: 'return_policy',    label: 'Return / refund policy', type: 'long', help: 'Shown on /policies page. Also reflected in AI bot answers.' },
  { key: 'shipping_policy',  label: 'Shipping policy', type: 'long' },
  { key: 'privacy_policy',   label: 'Privacy policy', type: 'long' },
  { key: 'terms',            label: 'Terms & conditions', type: 'long' },
  { key: 'contact_email',    label: 'Contact email', type: 'short' },
  { key: 'contact_phone',    label: 'Contact phone (display)', type: 'short' },
  { key: 'contact_address',  label: 'Studio address', type: 'short' },
  { key: 'whatsapp_number',  label: 'WhatsApp number (digits, no +)', type: 'short', help: 'For wa.me links. Example: 919667788175' },
  { key: 'instagram_url',    label: 'Instagram URL', type: 'short' },
  { key: 'footer_blurb',     label: 'Footer description', type: 'long' },
];

function SiteTextEditor() {
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await fetchContent<Record<string, string>>('site_text');
    setData(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try { await api('/api/admin/content/site_text', { method: 'PUT', body: JSON.stringify({ data }) }); alert('Saved'); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm('Reset all site text to defaults?')) return;
    await api('/api/admin/content/site_text/reset', { method: 'POST' });
    await load();
  };

  if (loading || !data) return <div className="text-center text-[#9C8878] py-10">Loading…</div>;

  return (
    <SectionShell title="Site Text" onSave={save} onReset={reset} saving={saving}>
      <p className="text-sm text-[#9C8878] mb-6">All text shown across the site — homepage copy, policy pages, contact info, footer. The AI chatbot also references the return policy.</p>
      <div className="space-y-5">
        {TEXT_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} testid={`sitetext-${f.key}`}>
            {f.type === 'long' ? (
              <textarea
                rows={4}
                value={data[f.key] || ''}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                className={inputCls}
                data-testid={`sitetext-input-${f.key}`}
              />
            ) : (
              <input
                value={data[f.key] || ''}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                className={inputCls}
                data-testid={`sitetext-input-${f.key}`}
              />
            )}
            {f.help && <p className="text-xs text-[#9C8878] mt-1">{f.help}</p>}
          </Field>
        ))}
      </div>
    </SectionShell>
  );
}
