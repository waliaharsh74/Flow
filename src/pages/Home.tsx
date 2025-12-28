import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Activity,
  ArrowRight,
  Clock,
  LockKeyhole,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react"

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Flow</p>
              <p className="text-xs text-muted-foreground">Workflow automation dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                Visual builder + execution console
              </Badge>
              <h1 className="mt-4 text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Design, launch, and monitor automated workflows in one place.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Flow gives teams a clear canvas to build triggers, actions, and logic,
                backed by credential management and real-time execution insights.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/auth">Start building</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">See the dashboard</Link>
                </Button>
              </div>
              <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Build workflows fast
                </div>
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  Secure credentials
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Track every run
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-transparent to-sky-200/40 blur-2xl" />
              <Card className="relative shadow-xl">
                <CardHeader>
                  <CardTitle>Workflow snapshot</CardTitle>
                  <CardDescription>How a typical automation flows in Flow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="h-9 w-9 rounded-lg bg-workflow-trigger text-white flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cron trigger</p>
                      <p className="text-xs text-muted-foreground">Every day at 9:00 AM</p>
                    </div>
                    <Badge variant="secondary">Trigger</Badge>
                  </div>

                  <div className="ml-6 space-y-4 border-l border-dashed border-border pl-6">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="h-9 w-9 rounded-lg bg-workflow-action text-white flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">LLM summary</p>
                        <p className="text-xs text-muted-foreground">Summarize new tickets</p>
                      </div>
                      <Badge variant="secondary">Action</Badge>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="h-9 w-9 rounded-lg bg-workflow-action text-white flex items-center justify-center">
                        <Workflow className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Notify team</p>
                        <p className="text-xs text-muted-foreground">Send email + Telegram</p>
                      </div>
                      <Badge variant="secondary">Action</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Build visually</CardTitle>
                <CardDescription>Drag nodes, connect steps, and validate logic.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use triggers, actions, and IF branches to map your automation in minutes.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Manage credentials</CardTitle>
                <CardDescription>Store secrets once and reuse across flows.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Keep API keys organized with quick search, filters, and updates.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Watch executions</CardTitle>
                <CardDescription>Trigger, pause, retry, and inspect steps.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Every run logs status, timestamps, and detailed outputs for debugging.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-foreground">Everything you need to automate.</h2>
              <p className="text-muted-foreground">
                From quick manual triggers to scheduled jobs, Flow keeps your workflow
                logic clear and your execution history in reach.
              </p>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    3
                  </span>
                  <p className="text-sm text-muted-foreground">Trigger types: manual, form, cron</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    3
                  </span>
                  <p className="text-sm text-muted-foreground">Action types: email, Telegram, LLM</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    1
                  </span>
                  <p className="text-sm text-muted-foreground">Logic node: IF branch with true/false paths</p>
                </div>
              </div>
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Launch in minutes</CardTitle>
                <CardDescription>Use the dashboard to keep workflows moving.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-primary" />
                  Create, duplicate, and export workflows instantly.
                </div>
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  Rotate credentials without breaking workflows.
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-primary" />
                  Retry failed steps and inspect payloads.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>Flow — Workflow automation dashboard</p>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
