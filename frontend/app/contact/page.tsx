"use client"

/**
 * Contact page with NAP (Name, Address, Phone) for trust and local SEO.
 */
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Contact BizBranches</h1>

        <p className="text-foreground/90 leading-relaxed mb-2 font-semibold">For business listing and inquiries</p>
        <p className="text-muted-foreground mb-6">
          We serve Pakistan. <strong className="text-foreground font-semibold">WhatsApp only</strong> for messages — we don&apos;t take calls. You can also email us.
        </p>

        <section className="space-y-4 mb-10" aria-label="Contact details">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">BizBranches</h2>
            <p className="text-muted-foreground text-sm">Pakistan free business listing directory</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">WhatsApp</p>
            <a
              href="https://wa.me/923142552851"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline font-medium"
            >
              +92 314 2552851
            </a>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Email</p>
            <a href="mailto:support@bizbranches.pk" className="text-primary underline block">support@bizbranches.pk</a>
          </div>
        </section>
      </div>
    </main>
  )
}
