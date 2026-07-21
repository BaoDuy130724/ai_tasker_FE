import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { useConfirm } from "@/shared/ui/use-confirm"
import {
  User as UserIcon,
  Camera,
  Save,
  PlusCircle,
  Trash2,
  Award,
  Briefcase,
  Tag,
} from "lucide-react"
import {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  addPortfolioItem,
  deletePortfolioItem,
  addSkillToProfile,
  addCertificate,
  getAllSkills,
} from "../api"
import type { UserProfile, Skill } from "../types"
import { UserRatingSummary } from "@/features/reviews/components/UserRatingSummary"

const certificateStatusStyle = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "Rejected":
      return "bg-destructive/10 text-destructive border-destructive/20"
    default:
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
  }
}

export const ProfilePage: React.FC = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const [form, setForm] = useState({ fullName: "", title: "", bio: "" })
  const [portfolioForm, setPortfolioForm] = useState({ title: "", description: "", link: "", imageUrl: "" })
  const [certForm, setCertForm] = useState({ name: "", fileUrl: "", issuedBy: "", issueDate: "" })
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [showCertForm, setShowCertForm] = useState(false)

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const data = await getMyProfile()
      if (data) {
        setProfile(data)
        setForm({ fullName: data.fullName || "", title: data.title || "", bio: data.bio || "" })
      }
    } catch (err) {
      console.error("Lỗi tải hồ sơ:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    getAllSkills().then(setAllSkills).catch((err) => console.error("Lỗi tải danh sách skill:", err))
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateProfile(form)
      await fetchProfile()
    } catch (err: any) {
      console.error(err)
      toast.error("Cập nhật hồ sơ thất bại.", err.response?.data?.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAvatar(true)
    try {
      await uploadAvatar(file)
      await fetchProfile()
    } catch (err: any) {
      console.error(err)
      toast.error("Tải ảnh đại diện thất bại.", err.response?.data?.message)
    } finally {
      setIsUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const handleAddSkill = async () => {
    if (!selectedSkillId) return
    try {
      await addSkillToProfile(Number(selectedSkillId))
      setSelectedSkillId("")
      await fetchProfile()
    } catch (err: any) {
      console.error(err)
      toast.error("Thêm kỹ năng thất bại.", err.response?.data?.message ?? "Kỹ năng này có thể đã có trong hồ sơ.")
    }
  }

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addPortfolioItem(portfolioForm)
      setPortfolioForm({ title: "", description: "", link: "", imageUrl: "" })
      setShowPortfolioForm(false)
      await fetchProfile()
    } catch (err: any) {
      console.error(err)
      toast.error("Thêm portfolio thất bại.", err.response?.data?.message)
    }
  }

  const handleDeletePortfolio = async (id: number) => {
    const ok = await confirm({
      title: "Xoá mục portfolio này?",
      description: "Mục sẽ bị gỡ khỏi hồ sơ công khai của bạn.",
      confirmText: "Xoá",
      variant: "destructive",
    })
    if (!ok) return
    try {
      await deletePortfolioItem(id)
      await fetchProfile()
    } catch (err: any) {
      console.error(err)
      toast.error("Xóa mục portfolio thất bại.", err.response?.data?.message)
    }
  }

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addCertificate(certForm)
      setCertForm({ name: "", fileUrl: "", issuedBy: "", issueDate: "" })
      setShowCertForm(false)
      await fetchProfile()
    } catch (err: any) {
      console.error(err)
      toast.error("Nộp chứng chỉ thất bại.", err.response?.data?.message)
    }
  }

  const availableSkills = allSkills.filter(
    (s) => !profile?.skills.some((ps) => ps.id === s.id)
  )

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-32 w-full bg-muted rounded-xl" />
        <div className="h-40 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Hồ sơ năng lực</h1>
        <p className="text-muted-foreground mt-1">Thông tin hồ sơ hiển thị công khai với Client/Expert khác trên hệ thống.</p>
      </div>

      {/* Avatar + Thông tin cơ bản */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border border-border" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center border border-border">
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-sm hover:bg-primary/90 transition-all"
            >
              <Camera className="h-3.5 w-3.5" />
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
          </div>
          <div>
            <p className="font-bold text-lg text-foreground">{profile?.fullName || "Chưa đặt tên"}</p>
            <p className="text-sm text-muted-foreground">{profile?.title || "Chưa có chức danh"}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
              {profile?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Họ và tên</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Chức danh</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: AI/ML Engineer, Product Designer..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Giới thiệu bản thân (Bio)</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSaving} className="bg-primary text-primary-foreground flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>

      {/* Đánh giá & Uy tín (nguồn thật từ Review service, không phải số denormalize) */}
      {profile && <UserRatingSummary userId={profile.userId} />}

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
          <Tag className="h-5 w-5 text-primary" />
          Kỹ năng
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile?.skills.length === 0 && <p className="text-sm text-muted-foreground">Chưa có kỹ năng nào.</p>}
          {profile?.skills.map((s) => (
            <span key={s.id} className="text-xs font-semibold bg-secondary/40 border border-border rounded-full px-3 py-1">
              {s.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Chọn kỹ năng để thêm --</option>
            {availableSkills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" disabled={!selectedSkillId} onClick={handleAddSkill}>
            Thêm
          </Button>
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Briefcase className="h-5 w-5 text-primary" />
            Portfolio
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowPortfolioForm((v) => !v)} className="flex items-center gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            Thêm dự án
          </Button>
        </div>

        {showPortfolioForm && (
          <form onSubmit={handleAddPortfolio} className="space-y-3 bg-secondary/10 border border-border/50 rounded-lg p-4">
            <input
              type="text" required placeholder="Tên dự án"
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
            />
            <textarea
              rows={2} placeholder="Mô tả ngắn"
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="url" placeholder="Link demo/github"
                value={portfolioForm.link}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, link: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="url" placeholder="Link ảnh minh họa"
                value={portfolioForm.imageUrl}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, imageUrl: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPortfolioForm(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">Lưu</Button>
            </div>
          </form>
        )}

        {profile?.portfolioItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dự án nào trong portfolio.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile?.portfolioItems.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 bg-secondary/10 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                  <button
                    onClick={() => handleDeletePortfolio(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                    aria-label="Xóa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block">
                    Xem dự án →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Award className="h-5 w-5 text-primary" />
            Chứng chỉ
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowCertForm((v) => !v)} className="flex items-center gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            Nộp chứng chỉ
          </Button>
        </div>

        {showCertForm && (
          <form onSubmit={handleAddCertificate} className="space-y-3 bg-secondary/10 border border-border/50 rounded-lg p-4">
            <input
              type="text" required placeholder="Tên chứng chỉ"
              value={certForm.name}
              onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
            />
            <input
              type="url" required placeholder="Link file chứng chỉ (PDF/ảnh)"
              value={certForm.fileUrl}
              onChange={(e) => setCertForm({ ...certForm, fileUrl: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" required placeholder="Đơn vị cấp"
                value={certForm.issuedBy}
                onChange={(e) => setCertForm({ ...certForm, issuedBy: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="date" required
                value={certForm.issueDate}
                onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Sau khi nộp, chứng chỉ sẽ ở trạng thái "Pending" chờ Admin duyệt.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCertForm(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">Nộp</Button>
            </div>
          </form>
        )}

        {profile?.certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa nộp chứng chỉ nào.</p>
        ) : (
          <div className="space-y-2">
            {profile?.certificates.map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-border rounded-lg p-3 bg-secondary/10">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.issuedBy} • {new Date(c.issueDate).toLocaleDateString("vi-VN")}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase border rounded px-2 py-0.5 ${certificateStatusStyle(c.status)}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
