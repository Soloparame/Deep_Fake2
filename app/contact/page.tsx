

export default function ContactPage() {
    return (
        <section className="relative min-h-screen overflow-hidden pt-24 pb-12">
            {/* Background Decor - consistent with upload page */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
                <div className="absolute right-[20%] bottom-[20%] h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]"></div>
            </div>

            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <div className="text-center py-12">
                    <h1 className="pb-4 font-nacelle text-4xl font-semibold text-slate-950 md:text-5xl">
                        Contact Support
                    </h1>
                    <p className="mx-auto max-w-xl text-lg text-slate-600">
                        Have questions or need assistance? We're here to help. Reach out to our team directly.
                    </p>
                </div>

                <div className="mx-auto max-w-xl">
                    {/* Contact Section - no card background, blends with page background */}
                    <div className="flex flex-col items-center gap-6 p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-3xl text-indigo-400 ring-1 ring-indigo-500/40">
                            📧
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-slate-950">Email Us</h3>
                            <p className="text-sm text-slate-600">Our team typically responds within 24 hours.</p>
                        </div>

                        <div className="w-full rounded-xl border border-white/10 p-4">
                            <a href="mailto:techsisters9@gmail.com" className="text-xl font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
                                techsisters9@gmail.com
                            </a>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <a href="#" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
                                Twitter
                            </a>
                            <a href="#" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
                                LinkedIn
                            </a>
                            <a href="#" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
