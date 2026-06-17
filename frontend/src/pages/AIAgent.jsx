import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Paperclip, Monitor, Play, CheckCircle, XCircle, Clock, BookOpen, Settings, Download, ChevronRight, Zap, Shield, AlertTriangle } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'

const suggestedPrompts = [
  { text: 'Why is mt-ap-lobby offline?', icon: AlertTriangle },
  { text: 'Check BGP status on mt-core-01', icon: Monitor },
  { text: 'Show high CPU devices', icon: Zap },
  { text: 'Backup all production devices', icon: Shield },
]

const mockRunbooks = [
  { id: '1', name: 'BGP Session Recovery', trigger: 'BGP session down', steps: 4, success: 95 },
  { id: '2', name: 'High CPU Remediation', trigger: 'CPU > 80% for 5min', steps: 6, success: 88 },
  { id: '3', name: 'Interface Flap Recovery', trigger: 'Interface down > 2min', steps: 3, success: 92 },
  { id: '4', name: 'PPPoE Session Cleanup', trigger: 'PPPoE > 90% capacity', steps: 5, success: 97 },
]

const mockPendingSuggestions = [
  { id: '1', device: 'mt-pppoe-con', issue: 'CPU at 78% for 10 minutes', action: 'Restart PPPoE service and check for stuck sessions', confidence: 85, time: '5m ago' },
  { id: '2', device: 'mt-core-01', issue: 'BGP session flap detected', action: 'Clear BGP session and verify peer connectivity', confidence: 72, time: '12m ago' },
]

const aiResponses = {
  'why is mt-ap-lobby offline': `Based on the device data, **mt-ap-lobby** (10.0.2.10) is showing offline status. Last seen: June 15, 2026 at 6:30 PM — over 18 hours ago.\n\n**Root cause analysis:**\n1. Device is a cAP ac (RBcAPGi-5acD2nD) at DC Jakarta\n2. No graceful shutdown detected in logs\n3. Likely causes: power failure, network cable issue, or firmware crash\n\n**Suggested actions:**\n1. Check PoE switch port status on mt-sw-floor3\n2. Verify power supply to the AP\n3. If remote recovery needed, try port reset via switch\n\nConfidence: 78%`,
  'check bgp status on mt-core-01': `**BGP Status for mt-core-01 (10.0.0.1):**\n\n| Peer | State | Prefixes | Uptime |\n|------|-------|----------|--------|\n| 10.0.0.2 | Established | 142 | 45d 12h |\n| 10.0.0.3 | Established | 89 | 12d 5h |\n| 10.0.0.4 | Idle | 0 | — |\n\n**Issues detected:**\n- Peer 10.0.0.4 is in Idle state (session flap detected 12 minutes ago)\n- This peer previously had 67 prefixes\n\n**Recommendation:** Investigate connectivity to 10.0.0.4. Check physical link and BGP configuration.\n\nConfidence: 92%`,
  'default': `I've analyzed your request. Here's what I found:\n\n**Network Summary:**\n- 5 devices monitored, 3 online, 1 offline, 1 warning\n- 2 active alerts (1 critical, 1 warning)\n- 1 running task (Template push to mt-pppoe-con)\n\n**Recommendations:**\n1. Address the offline mt-ap-lobby device\n2. Investigate high CPU on mt-pppoe-con (78%)\n3. Review BGP session flap on mt-core-01\n\nWould you like me to take any specific action?`
}

export default function AIAgent() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m Hermes, your network AI agent. I can help you troubleshoot issues, analyze network health, and automate remediation. What would you like to know?', time: new Date().toISOString() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [attachedDevice, setAttachedDevice] = useState(null)
  const [attachedLog, setAttachedLog] = useState(null)
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(80)
  const [pendingSuggestions, setPendingSuggestions] = useState(mockPendingSuggestions)
  const [executionLog, setExecutionLog] = useState([])
  const [showRunbookModal, setShowRunbookModal] = useState(false)
  const [newRunbook, setNewRunbook] = useState({ name: '', trigger: '', steps: '', rollback: '' })
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim(), time: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const key = Object.keys(aiResponses).find(k => text.toLowerCase().includes(k)) || 'default'
      const aiMsg = { role: 'ai', text: aiResponses[key], time: new Date().toISOString() }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  const handleApprove = (id) => {
    const suggestion = pendingSuggestions.find(s => s.id === id)
    setPendingSuggestions(prev => prev.filter(s => s.id !== id))
    setExecutionLog(prev => [...prev, { ...suggestion, executedAt: new Date().toISOString(), result: 'success' }])
  }

  const handleReject = (id) => {
    setPendingSuggestions(prev => prev.filter(s => s.id !== id))
  }

  const exportConversation = () => {
    const text = messages.map(m => `[${m.role === 'ai' ? 'Hermes' : 'You'}] ${new Date(m.time).toLocaleTimeString()}\n${m.text}`).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hermes-chat-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">AI Agent — Hermes</h1>
            <p className="text-sm text-on-surface-variant">Intelligent network assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Auto-approve:</span>
            <input type="range" min="0" max="100" value={autoApproveThreshold} onChange={e => setAutoApproveThreshold(e.target.value)} className="w-24 accent-primary" />
            <span className="text-primary font-medium">{autoApproveThreshold}%</span>
          </div>
          <Button variant="ghost" size="sm" onClick={exportConversation}><Download size={14} /> Export</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        {['chat', 'pending', 'runbooks', 'executions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            {tab === 'pending' ? `Pending (${pendingSuggestions.length})` : tab === 'executions' ? `Executions (${executionLog.length})` : tab}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="min-h-[28rem] max-h-[36rem] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot size={16} className="text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}>
                      <div className="whitespace-pre-wrap">{msg.text.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}</div>
                      <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-on-primary/60' : 'text-on-surface-variant'}`}>
                        {new Date(msg.time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <div className="bg-surface-container rounded-xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Context badges */}
              {(attachedDevice || attachedLog) && (
                <div className="px-4 pb-2 flex gap-2">
                  {attachedDevice && (
                    <Badge variant="info" className="flex items-center gap-1">
                      <Monitor size={12} /> {attachedDevice}
                      <button onClick={() => setAttachedDevice(null)} className="ml-1 hover:text-error"><XCircle size={12} /></button>
                    </Badge>
                  )}
                  {attachedLog && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Paperclip size={12} /> {attachedLog}
                      <button onClick={() => setAttachedLog(null)} className="ml-1 hover:text-error"><XCircle size={12} /></button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-outline-variant">
                <div className="flex gap-2">
                  <input type="file" id="log-upload" className="hidden" accept=".log,.txt" onChange={e => setAttachedLog(e.target.files[0]?.name || null)} />
                  <label htmlFor="log-upload" className="p-2 rounded-lg hover:bg-surface-container cursor-pointer">
                    <Paperclip size={18} className="text-on-surface-variant" />
                  </label>
                  <select value={attachedDevice || ''} onChange={e => setAttachedDevice(e.target.value || null)}
                    className="px-2 py-1 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface">
                    <option value="">Attach device...</option>
                    <option value="mt-core-01">mt-core-01</option>
                    <option value="mt-branch-02">mt-branch-02</option>
                    <option value="mt-ap-lobby">mt-ap-lobby</option>
                    <option value="mt-sw-floor3">mt-sw-floor3</option>
                    <option value="mt-pppoe-con">mt-pppoe-con</option>
                  </select>
                  <input type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                    placeholder="Ask Hermes about your network..."
                    className="flex-1 px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping}>
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full text-sm text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant">
                  <p.icon size={14} /> {p.text}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle size={16} /> Pending Actions</CardTitle></CardHeader>
              {pendingSuggestions.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">No pending suggestions</p>
              ) : (
                <div className="space-y-3">
                  {pendingSuggestions.map(s => (
                    <div key={s.id} className="p-3 bg-surface-container rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-on-surface">{s.device}</span>
                        <Badge variant={s.confidence >= 80 ? 'online' : 'warning'}>{s.confidence}%</Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-2">{s.issue}</p>
                      <p className="text-xs text-primary mb-2">{s.action}</p>
                      <div className="flex gap-1">
                        <Button size="sm" className="flex-1" onClick={() => handleApprove(s.id)}><CheckCircle size={12} /> Approve</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleReject(s.id)}><XCircle size={12} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap size={16} /> Quick Runbooks</CardTitle></CardHeader>
              <div className="space-y-2">
                {mockRunbooks.slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container">
                    <div>
                      <p className="text-xs font-medium text-on-surface">{r.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{r.steps} steps · {r.success}% success</p>
                    </div>
                    <Button variant="ghost" size="sm"><Play size={12} /></Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingSuggestions.length === 0 ? (
            <Card><div className="text-center py-12"><CheckCircle size={48} className="text-success mx-auto mb-4" /><p className="text-on-surface-variant">No pending suggestions</p></div></Card>
          ) : pendingSuggestions.map(s => (
            <Card key={s.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={s.confidence >= 80 ? 'online' : 'warning'}>{s.confidence}% confidence</Badge>
                    <span className="text-xs text-on-surface-variant">{s.device} · {s.time}</span>
                  </div>
                  <p className="text-sm font-medium text-on-surface mb-1">{s.issue}</p>
                  <p className="text-sm text-primary">{s.action}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(s.id)}><CheckCircle size={14} /> Approve</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReject(s.id)}><XCircle size={14} /> Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'runbooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-on-surface-variant">{mockRunbooks.length} runbooks available</p>
            <Button size="sm" onClick={() => setShowRunbookModal(true)}><BookOpen size={14} /> Create Runbook</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockRunbooks.map(r => (
              <Card key={r.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{r.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Trigger: {r.trigger}</p>
                  </div>
                  <Badge variant="online">{r.success}%</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3">
                  <span>{r.steps} steps</span>
                  <span>Success rate: {r.success}%</span>
                </div>
                <Button variant="secondary" size="sm" className="w-full"><Play size={14} /> Execute Runbook</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'executions' && (
        <div className="space-y-4">
          {executionLog.length === 0 ? (
            <Card><div className="text-center py-12"><Clock size={48} className="text-outline mx-auto mb-4" /><p className="text-on-surface-variant">No executions yet</p></div></Card>
          ) : executionLog.map((e, i) => (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-on-surface">{e.device}</span>
                    <Badge variant="online">{e.result}</Badge>
                  </div>
                  <p className="text-sm text-on-surface-variant">{e.action}</p>
                  <p className="text-xs text-outline mt-1">Executed: {new Date(e.executedAt).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Runbook Modal */}
      {showRunbookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRunbookModal(false)}>
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-[32rem] space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-on-surface">Create Runbook</h3>
            <Input label="Name" value={newRunbook.name} onChange={e => setNewRunbook({...newRunbook, name: e.target.value})} placeholder="BGP Recovery" />
            <Input label="Trigger Condition" value={newRunbook.trigger} onChange={e => setNewRunbook({...newRunbook, trigger: e.target.value})} placeholder="BGP session down" />
            <Textarea label="Steps (one per line)" value={newRunbook.steps} onChange={e => setNewRunbook({...newRunbook, steps: e.target.value})} placeholder="1. Check peer status&#10;2. Clear BGP session&#10;3. Verify connectivity" rows={4} />
            <Textarea label="Rollback Procedure" value={newRunbook.rollback} onChange={e => setNewRunbook({...newRunbook, rollback: e.target.value})} placeholder="Restore previous BGP config" rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowRunbookModal(false)}>Cancel</Button>
              <Button onClick={() => setShowRunbookModal(false)}>Create Runbook</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
