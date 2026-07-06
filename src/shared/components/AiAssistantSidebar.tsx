import React, { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { aiApi } from "@/shared/api/client"
import { getJobById } from "@/features/jobs/api"
import { Button } from "@/components/ui/button"
import { BrainCircuit, X, Send, Sparkles, User } from "lucide-react"

interface Message {
  sender: "user" | "ai"
  text: string
  timestamp: Date
  isRecommendResult?: boolean
  experts?: Array<{
    expertId: number
    fullName: string
    matchScore: number
    skills: string[]
    availabilityStatus: string
  }>
}

export const AiAssistantSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Xin chào! Tôi là Trợ lý AI Tasker 🤖. Tôi có thể giúp bạn sinh mô tả công việc, viết đề xuất dịch vụ hoặc tìm kiếm & đề xuất Expert phù hợp nhất với Job hiện tại của bạn.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Trích xuất Job ID từ URL nếu có (VD: /jobs/3)
  const jobMatch = location.pathname.match(/\/jobs\/(\d+)/)
  const currentJobId = jobMatch ? Number(jobMatch[1]) : null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    setMessages((prev) => [...prev, { sender: "user", text: userText, timestamp: new Date() }])
    setInput("")
    setIsTyping(true)

    // Tạo câu trả lời thông minh dựa trên từ khoá và ngữ cảnh trang
    setTimeout(async () => {
      try {
        const lower = userText.toLowerCase()
        
        if ((lower.includes("đề xuất") || lower.includes("expert") || lower.includes("chuyên gia")) && currentJobId) {
          // Gọi API đề xuất expert thật của AI Service!
          setMessages((prev) => [...prev, { sender: "ai", text: "Đang phân tích mô tả công việc hiện tại và chạy Vector Search so khớp Expert phù hợp...", timestamp: new Date() }])
          
          const jobData = await getJobById(currentJobId)
          if (jobData?.description) {
            const response = await aiApi.post("/aiservices/recommend-experts", {
              jobDescription: jobData.description,
            })
            const data = response.data
            
            if (data?.recommendedExperts && data.recommendedExperts.length > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  text: `Dưới đây là danh sách các Expert phù hợp nhất được AI đề xuất cho công việc "${jobData.title}":`,
                  timestamp: new Date(),
                  isRecommendResult: true,
                  experts: data.recommendedExperts.map((exp: any) => ({
                    expertId: exp.expertId,
                    fullName: exp.fullName || `Expert #${exp.expertId}`,
                    matchScore: exp.matchScore || exp.score || 95,
                    skills: exp.skills || ["AI Development", "Python"],
                    availabilityStatus: exp.availabilityStatus || "Available",
                  })),
                },
              ])
            } else {
              setMessages((prev) => [...prev, { sender: "ai", text: "Không tìm thấy Expert nào phù hợp hoặc các Expert hiện tại đang bận.", timestamp: new Date() }])
            }
          } else {
            setMessages((prev) => [...prev, { sender: "ai", text: "Không tìm thấy mô tả công việc để chạy phân tích AI.", timestamp: new Date() }])
          }
        } else if (lower.includes("hello") || lower.includes("xin chào") || lower.includes("hi")) {
          setMessages((prev) => [...prev, { sender: "ai", text: "Xin chào! Bạn cần tôi hỗ trợ tư vấn điều khoản hợp đồng hay tìm kiếm giải pháp AI nào hôm nay?", timestamp: new Date() }])
        } else if (lower.includes("hợp đồng") || lower.includes("contract")) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: "Mẫu hợp đồng dịch vụ AI tiêu chuẩn của chúng tôi cam kết bảo mật mã nguồn, phân chia thanh toán thông qua ví ký quỹ Escrow theo từng mốc bàn giao đã thống nhất trước đó. Bạn có muốn tạo Milestone đặt cọc tiền ngay không?",
              timestamp: new Date(),
            },
          ])
        } else {
          // Trả lời chatbot thông thường
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: "Tôi hiểu câu hỏi của bạn. Hệ thống AI Tasker hỗ trợ kết nối microservices đồng bộ qua gRPC, ký quỹ bảo vệ tài chính qua Escrow và giao tiếp thời gian thực SignalR. Bạn có muốn tôi hướng dẫn cách nạp tiền ký quỹ hay đăng tin tuyển dụng không?",
              timestamp: new Date(),
            },
          ])
        }
      } catch (err) {
        console.error(err)
        setMessages((prev) => [...prev, { sender: "ai", text: "Có lỗi xảy ra khi gọi dịch vụ trợ lý AI. Vui lòng thử lại sau.", timestamp: new Date() }])
      } finally {
        setIsTyping(false)
      }
    }, 1000)
  }

  const triggerRecommend = async () => {
    if (!currentJobId) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Trợ lý AI chỉ có thể đề xuất Expert khi bạn đang xem trang chi tiết một Job tuyển dụng cụ thể.", timestamp: new Date() }])
      return
    }
    await handleSend({ preventDefault: () => {} } as any)
  }

  return (
    <div className="fixed bottom-20 right-6 left-6 md:left-auto md:w-96 h-[500px] max-h-[calc(100vh-120px)] border border-border bg-card flex flex-col rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <BrainCircuit className="h-5 w-5 animate-pulse" />
          AI Assistant 🤖
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`space-y-1.5 ${m.sender === "user" ? "text-right" : "text-left"}`}>
            <span className="text-[10px] text-muted-foreground font-semibold">
              {m.sender === "user" ? "Bạn" : "AI Trợ lý"}
            </span>
            <div className={`p-3 rounded-xl leading-relaxed whitespace-pre-wrap text-left ${
              m.sender === "user"
                ? "bg-primary text-primary-foreground ml-8 rounded-tr-none"
                : "bg-secondary text-foreground mr-8 rounded-tl-none border"
            }`}>
              <p>{m.text}</p>
              
              {/* Kết quả recommend expert chuyên biệt */}
              {m.isRecommendResult && m.experts && (
                <div className="mt-3.5 space-y-2.5">
                  {m.experts.map((exp) => (
                    <div key={exp.expertId} className="border border-border/80 rounded-lg p-2.5 bg-card/60 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-primary flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {exp.fullName}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[9px] border border-emerald-500/20">
                          {exp.matchScore}% khớp
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {exp.skills.map((s) => (
                          <span key={s} className="bg-secondary text-[8px] px-1.5 py-0.5 rounded text-muted-foreground border">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-left space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold">AI Trợ lý</span>
            <div className="bg-secondary text-foreground p-3 rounded-xl rounded-tl-none border w-20 flex gap-1 justify-center items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI helper shortcuts */}
      {currentJobId && messages.length === 1 && (
        <div className="p-3 border-t border-border bg-secondary/10 flex justify-center">
          <Button
            onClick={() => { setInput("Đề xuất Expert phù hợp"); triggerRecommend(); }}
            size="sm"
            variant="outline"
            className="text-[10px] border-primary/20 text-primary font-bold hover:bg-primary/5 flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3" />
            Đề xuất Expert cho Job này 🎯
          </Button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi trợ lý AI..."
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-semibold px-3 h-8">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  )
}
