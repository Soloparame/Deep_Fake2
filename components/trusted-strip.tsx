const trustedBrands = [
  "Northwave",
  "Quanta",
  "Lumen",
  "Helios",
  "Aurora",
  "Vector",
];

export default function TrustedStrip() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-y py-10 [border-image:linear-gradient(to_right,transparent,--theme(--color-indigo-200),transparent)1]">
          <p className="text-center text-sm font-medium text-slate-700 md:text-base">
            Trusted by writers, students &amp; teams worldwide
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trustedBrands.map((brand) => (
              <div
                key={brand}
                className="rounded-xl border border-indigo-100 bg-white px-4 py-2 text-center text-sm font-medium text-slate-600 shadow-sm"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
