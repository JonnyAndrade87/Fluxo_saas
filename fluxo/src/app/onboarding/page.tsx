import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, MonitorPlay, Factory, LayoutGrid } from "lucide-react"

export default function OnboardingWelcomePage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full flex flex-col items-center">
      
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-obsidian">
          Bem-vindo ao fim da inadimplência.
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Para que o Fluxo sugira a melhor régua de comunicação para seus clientes, conta pra gente: qual o segmento principal da sua operação hoje?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-12">
        <label className="relative flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50">
          <input type="radio" name="segment" value="services" className="sr-only" defaultChecked />
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-has-[:checked]:bg-indigo-100 group-has-[:checked]:text-indigo-700 text-indigo-500 transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h3 className="font-semibold text-obsidian text-sm group-has-[:checked]:text-indigo-900">Prestação de Serviços & B2B</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Agências, Consultorias, Clínicas, Escritórios de Advocacia.</p>
          </div>
        </label>

        <label className="relative flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50">
          <input type="radio" name="segment" value="tech" className="sr-only" />
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-has-[:checked]:bg-indigo-100 group-has-[:checked]:text-indigo-700 text-indigo-500 transition-colors">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h3 className="font-semibold text-obsidian text-sm group-has-[:checked]:text-indigo-900">Tecnologia & SaaS</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Software Houses, Startups, Plataformas por Assinatura.</p>
          </div>
        </label>

        <label className="relative flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50">
          <input type="radio" name="segment" value="industry" className="sr-only" />
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-has-[:checked]:bg-indigo-100 group-has-[:checked]:text-indigo-700 text-indigo-500 transition-colors">
            <Factory className="w-5 h-5" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h3 className="font-semibold text-obsidian text-sm group-has-[:checked]:text-indigo-900">Indústria & Distribuição</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Atacadistas, Manufatura, Importadoras com faturamento B2B.</p>
          </div>
        </label>

        <label className="relative flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50">
          <input type="radio" name="segment" value="other" className="sr-only" />
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-has-[:checked]:bg-indigo-100 group-has-[:checked]:text-indigo-700 text-indigo-500 transition-colors">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h3 className="font-semibold text-obsidian text-sm group-has-[:checked]:text-indigo-900">Outros Formatos</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Meu segmento é diferente mas emito boletos/faturas todo mês.</p>
          </div>
        </label>
      </div>

      <div className="text-center w-full max-w-xl">
        <Link href="/onboarding/importar" passHref>
          <Button variant="beam" className="w-full sm:w-auto px-10 h-12 text-base shadow-lg shadow-indigo-500/20">
            Iniciar meu Setup <span className="ml-2 font-mono">→</span>
          </Button>
        </Link>
      </div>

    </div>
  )
}
