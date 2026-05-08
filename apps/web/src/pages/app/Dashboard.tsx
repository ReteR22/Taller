import { motion } from 'framer-motion'
import { DollarSign, Wrench, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useDashboard, useWorkOrders } from '@/hooks'
import { Badge, PageHeader, Spinner } from '@/components/ui'
import type { WorkOrderStatus } from '@/types'

const stagger = { hidden:{opacity:0}, show:{opacity:1,transition:{staggerChildren:0.07}} }
const fadeUp  = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{type:'spring' as const,stiffness:300,damping:26}} }

const FALLBACK = [
  {mes:'Oct',ingresos:61000,labor:24000},{mes:'Nov',ingresos:58000,labor:22000},
  {mes:'Dic',ingresos:74000,labor:29000},{mes:'Ene',ingresos:56000,labor:20000},
]
const DONUT = [
  {name:'En curso',value:12,color:'#3B82F6'},{name:'Completadas',value:28,color:'#34D399'},
  {name:'Pendientes',value:8,color:'#F59E0B'},{name:'Esperando',value:5,color:'#8B5CF6'},
]
const STATUS_CFG: Record<WorkOrderStatus,{label:string;color:string}> = {
  PENDING:      {label:'Pendiente',    color:'#FBBF24'},
  IN_PROGRESS:  {label:'En curso',     color:'#60A5FA'},
  WAITING_PARTS:{label:'Esp. repuesto',color:'#C084FC'},
  COMPLETED:    {label:'Completado',   color:'#34D399'},
  DELIVERED:    {label:'Entregado',    color:'#94A3B8'},
  CANCELLED:    {label:'Cancelado',    color:'#F87171'},
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-overlay border border-white/10 rounded-xl p-3 shadow-card text-xs">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p:any)=><p key={p.name} style={{color:p.color}}>{p.name}: <strong>${p.value.toLocaleString()}</strong></p>)}
    </div>
  )
}

function KpiCard({title,value,change,icon,color}:{title:string;value:string;change?:number;icon:React.ReactNode;color:string}) {
  const up=(change??0)>=0
  return (
    <motion.div variants={fadeUp}>
      <div className="bg-surface-raised rounded-xl p-5 border hover:-translate-y-1 transition-all duration-200"
        style={{borderColor:`${color}20`,boxShadow:`0 4px 20px ${color}0D`}}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-white/35 uppercase tracking-widest mb-2">{title}</p>
            <p className="text-3xl font-display" style={{color}}>{value}</p>
            {change!==undefined&&(
              <div className={`flex items-center gap-1 mt-2 text-xs ${up?'text-emerald-400':'text-red-400'}`}>
                {up?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
                <span>{Math.abs(change)}% vs mes anterior</span>
              </div>
            )}
          </div>
          <div className="p-2.5 rounded-xl" style={{background:`${color}15`}}>
            <span style={{color}}>{icon}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function Dashboard() {
  const { summary, revenue, loading: loadingStats } = useDashboard()
  const { data: recentOrders, loading: loadingOrders } = useWorkOrders({}, 1, 5)

  const chartData = revenue.length>0
    ? revenue.slice(-7).map(r=>({mes:r.month.slice(5),ingresos:Math.round(r.revenue),labor:Math.round(r.labor)}))
    : FALLBACK

  const kpis = [
    {title:'Ingresos del Mes', value:summary?`$${Math.round(summary.thisMonth.revenue).toLocaleString()}`:'—', change:summary?.revenueChange, icon:<DollarSign size={20}/>, color:'#F59E0B'},
    {title:'Órdenes Activas',  value:summary?String(summary.pendingOrders):'—',  icon:<Wrench size={20}/>,   color:'#EF4444'},
    {title:'Clientes Totales', value:summary?String(summary.totalClients):'—',   icon:<Users size={20}/>,    color:'#3B82F6'},
    {title:'Mano de Obra Mes', value:summary?`$${Math.round(summary.thisMonth.labor).toLocaleString()}`:'—', icon:<Activity size={20}/>, color:'#8B5CF6'},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard"
        subtitle={`Resumen — ${new Date().toLocaleDateString('es-AR',{month:'long',year:'numeric'})}`} />

      {loadingStats?(
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i=><div key={i} className="h-28 bg-surface-raised rounded-xl shimmer"/>)}
        </div>
      ):(
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k,i)=><KpiCard key={i} {...k}/>)}
        </motion.div>
      )}

      <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-surface-raised border border-white/[0.08] rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm">Ingresos Mensuales</h3>
            <div className="flex gap-4 text-xs text-white/35">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block"/>Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-info inline-block"/>Labor</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="mes" tick={{fill:'rgba(255,255,255,0.3)',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'rgba(255,255,255,0.3)',fontSize:11}} axisLine={false} tickLine={false}
                tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<Tip/>} cursor={{fill:'rgba(255,255,255,0.02)'}}/>
              <Bar dataKey="ingresos" name="Ingresos"     fill="#EF4444" radius={[4,4,0,0]} opacity={0.88}/>
              <Bar dataKey="labor"    name="Mano de obra" fill="#3B82F6" radius={[4,4,0,0]} opacity={0.88}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-raised border border-white/[0.08] rounded-xl p-5">
          <h3 className="font-bold text-sm mb-3">Estado de Órdenes</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={DONUT} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value">
                {DONUT.map((d,i)=><Cell key={i} fill={d.color} opacity={0.9}/>)}
              </Pie>
              <Tooltip formatter={(v:any)=>[`${v} órdenes`]}
                contentStyle={{background:'#1C1C1C',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2">
            {DONUT.map(d=>(
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{background:d.color}}/>
                <span className="text-white/40 truncate">{d.name}</span>
                <strong className="ml-auto">{d.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.45}}
        className="bg-surface-raised border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-bold text-sm">Órdenes Recientes</h3>
          <a href="/app/orders" className="text-xs text-white/35 hover:text-white transition-colors">Ver todas →</a>
        </div>
        {loadingOrders?(
          <div className="flex items-center justify-center py-10"><Spinner/></div>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Nro. Orden','Cliente','Vehículo','Estado','Total'].map(h=>(
                    <th key={h} className="text-left text-[10px] font-semibold text-white/20 uppercase tracking-widest px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o,i)=>{
                  const cfg=STATUS_CFG[o.status as WorkOrderStatus]
                  const c=o.vehicle?.client
                  return (
                    <motion.tr key={o.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.05}}
                      className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.015] transition-colors cursor-pointer">
                      <td className="px-5 py-3.5 text-sm font-mono font-semibold text-info">{o.number}</td>
                      <td className="px-5 py-3.5 text-sm">{c?`${c.firstName} ${c.lastName}`:'—'}</td>
                      <td className="px-5 py-3.5 text-sm text-white/45">{o.vehicle?`${o.vehicle.brand} ${o.vehicle.model} ${o.vehicle.year}`:'—'}</td>
                      <td className="px-5 py-3.5"><Badge color={cfg.color}>{cfg.label}</Badge></td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gold">${Number(o.total).toLocaleString('es-AR')}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
