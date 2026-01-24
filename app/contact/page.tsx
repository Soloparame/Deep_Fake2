

export default function ContactPage() {
    return (
        <section className="relative min-h-screen overflow-hidden bg-gray-900 pt-24 pb-12">
            {/* Background Decor */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
                <div className="absolute right-[20%] bottom-[20%] h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]"></div>
            </div>

            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <div className="text-center py-12">
                    <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                        Contact Support
                    </h1>
                    <p className="mx-auto max-w-xl text-lg text-indigo-200/65">
                        Have questions or need assistance? We're here to help. Reach out to our team directly.
                    </p>
                </div>

                <div className="mx-auto max-w-xl">
                    {/* Contact Card with Premium Styling */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gray-900/50 p-8 text-center transition-all before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-3xl text-indigo-400 ring-1 ring-indigo-500/40">
                                📧
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white">Email Us</h3>
                                <p className="text-sm text-gray-400">Our team typically responds within 24 hours.</p>
                            </div>

                            <div className="w-full rounded-xl bg-gray-800/50 p-4 border border-gray-700/50">
                                <a href="mailto:techsisters9@gmail.com" className="text-xl font-medium text-indigo-300 hover:text-indigo-200 transition-colors">
                                    techsisters9@gmail.com
                                </a>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <a href="#" className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                                    Twitter
                                </a>
                                <a href="#" className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                                    LinkedIn
                                </a>
                                <a href="#" className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                                    GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
