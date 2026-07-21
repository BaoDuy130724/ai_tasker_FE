import React, { useEffect, useState } from "react"
import { getPendingCertificates, approveCertificate, rejectCertificate } from "../api"
import type { Certificate } from "../types"
import { Button } from "@/components/ui/button"
import { Award, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/shared/ui/toast"
import { useConfirm } from "@/shared/ui/confirm-dialog"

export const AdminCertificatePage: React.FC = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const [certs, setCerts] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCerts = async () => {
    setIsLoading(true)
    try {
      const data = await getPendingCertificates()
      setCerts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCerts()
  }, [])

  const handleApprove = async (id: number) => {
    const ok = await confirm({
      title: "Phê duyệt chứng chỉ này?",
      description: "Chuyên gia sẽ được cấp tích xanh uy tín trên hồ sơ công khai.",
      confirmText: "Phê duyệt",
    })
    if (!ok) return
    try {
      await approveCertificate(id)
      toast.success("Đã phê duyệt chứng chỉ thành công!")
      await fetchCerts()
    } catch (err) {
      console.error(err)
      toast.error("Phê duyệt thất bại.")
    }
  }

  const handleReject = async (id: number) => {
    const ok = await confirm({
      title: "Từ chối chứng chỉ này?",
      description: "Expert sẽ cần nộp lại hồ sơ năng lực nếu muốn được cấp tích xanh.",
      confirmText: "Từ chối",
      variant: "destructive",
    })
    if (!ok) return
    try {
      await rejectCertificate(id)
      toast.success("Đã từ chối chứng chỉ thành công!")
      await fetchCerts()
    } catch (err) {
      console.error(err)
      toast.error("Từ chối thất bại.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Phê Duyệt Chứng Chỉ Chuyên Môn</h1>
        <p className="text-muted-foreground mt-1">Duyệt hồ sơ chứng chỉ năng lực AI của Expert để kích hoạt tích xanh thương hiệu.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-20 rounded-xl bg-card border" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <Award className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không có hồ sơ nào đang chờ duyệt</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Hệ thống hiện tại sạch sẽ. Tất cả các chứng chỉ của Expert đã được xử lý.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certs.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 p-1.5 text-primary">
                    <Award className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Đơn vị cấp: {c.issuedBy} • Ngày cấp: {new Date(c.issueDate).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {c.fileUrl && (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Xem file chứng chỉ đính kèm
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 justify-end">
                <Button
                  onClick={() => handleReject(c.id)}
                  variant="outline"
                  size="sm"
                  className="border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Từ chối
                </Button>
                <Button
                  onClick={() => handleApprove(c.id)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Phê duyệt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
