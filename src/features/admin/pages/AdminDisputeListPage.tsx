import React, { useEffect, useState } from "react"
import { getDisputes, resolveDispute } from "@/features/contracts-projects/api"
import type { Dispute } from "@/features/contracts-projects/api"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink, AlertTriangle, Scale } from "lucide-react"

export const AdminDisputeListPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [projectIdFilter, setProjectIdFilter] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const fetchDisputesList = async () => {
    setIsLoading(true)
    try {
      // getDisputes accepts optional projectId filter
      const pid = projectIdFilter ? parseInt(projectIdFilter, 10) : undefined
      const data = await getDisputes(isNaN(pid as any) ? undefined : pid)
      
      // Client-side status filtering if needed
      let filtered = data
      if (selectedStatus !== "") {
        const statusNum = parseInt(selectedStatus, 10)
        filtered = data.filter((d) => d.status === statusNum)
      }
      setDisputes(filtered)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputesList()
  }, [projectIdFilter, selectedStatus])

  const handleResolve = async (disputeId: number, resolution: number) => {
    const resolutionText = resolution === 0 ? "Hoàn tiền cho Client" : "Giải ngân cho Expert"
    if (!window.confirm(`Bạn có chắc chắn muốn giải quyết tranh chấp này bằng phương án: "${resolutionText}"?`)) {
      return
    }

    try {
      await resolveDispute(disputeId, resolution)
      alert("Giải quyết tranh chấp thành công!")
      await fetchDisputesList()
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || "Xử lý tranh chấp thất bại. Vui lòng thử lại.")
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            Open
          </span>
        )
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Under Review
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Resolved
          </span>
        )
      default:
        return null
    }
  }

  const getResolutionText = (res: number | null) => {
    if (res === null || res === undefined) return "N/A"
    return res === 0 ? "Hoàn tiền Client (RefundClient)" : "Giải ngân Expert (ReleaseToExpert)"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Tranh Chấp (Disputes)</h1>
        <p className="text-muted-foreground mt-1">
          Hệ thống trọng tài xử lý các khiếu nại, tranh chấp hợp đồng giữa Client và Expert. Quyết định của Admin sẽ giải phóng hoặc hoàn trả quỹ Escrow ký quỹ.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="number"
            value={projectIdFilter}
            onChange={(e) => setProjectIdFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none"
            placeholder="Lọc theo mã dự án (Project ID)..."
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none min-w-[200px]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="0">Open</option>
          <option value="1">Under Review</option>
          <option value="2">Resolved</option>
        </select>
        
        <Button onClick={fetchDisputesList} className="bg-primary text-primary-foreground font-semibold px-6">
          Làm mới
        </Button>
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-32 rounded-xl bg-card border" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <Scale className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy tranh chấp nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Hệ thống hiện tại chưa ghi nhận khiếu nại tranh chấp nào khớp với bộ lọc.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-foreground">Dispute #{d.id}</span>
                    {getStatusBadge(d.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dự án ID: <span className="font-semibold text-primary">#{d.projectId}</span> • Tạo bởi User #{d.openedBy} ({d.openerRole})
                  </p>
                </div>

                {d.status !== 2 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleResolve(d.id, 0)}
                      variant="outline"
                      size="sm"
                      className="border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Hoàn tiền Client
                    </Button>
                    <Button
                      onClick={() => handleResolve(d.id, 1)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Giải ngân Expert
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lý do tranh chấp</h4>
                  <p className="text-sm text-foreground mt-1 bg-secondary/20 p-3 rounded-lg border border-border/55 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                {d.evidenceFileUrl && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <a
                      href={d.evidenceFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Xem file bằng chứng khiếu nại
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {d.status === 2 && (
                  <div className="bg-emerald-50/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-800 dark:text-emerald-400">
                    <div className="font-bold flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      Tranh chấp đã được xử lý bởi Admin
                    </div>
                    <div className="mt-1">
                      <p>Quyết định: <span className="font-semibold">{getResolutionText(d.resolution)}</span></p>
                      <p>Người duyệt: Admin #{d.resolvedBy} • Thời gian: {d.resolvedAt ? new Date(d.resolvedAt).toLocaleString("vi-VN") : "N/A"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
