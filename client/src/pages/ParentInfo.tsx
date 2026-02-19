export default function ParentInfo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Informatie voor ouders
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Alles wat je moet weten over Matti
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* What is Matti */}
          <div className="bg-surface border border-border rounded-2xl p-6" style={{backgroundColor: '#baf2d8'}}>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span>🤖</span>
              Wat is Matti?
            </h2>
            <p className="text-base text-foreground leading-relaxed">
              Matti is een AI-chatbuddy speciaal ontworpen voor jongeren tussen
              12 en 21 jaar. Matti helpt jongeren met dagelijkse uitdagingen
              zoals school, vriendschappen, gevoelens en toekomstplannen door
              een luisterend oor te bieden en praktische tips te geven.
            </p>
          </div>

          {/* Privacy & Security */}
          <div className="bg-surface border border-border rounded-2xl p-6" style={{backgroundColor: '#baf2d8'}}>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span>🔒</span>
              Privacy & Veiligheid
            </h2>
            <ul className="space-y-2 text-base text-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Alle gesprekken worden lokaal op het apparaat van uw kind
                  opgeslagen
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Niemand anders heeft toegang tot de gesprekken, inclusief
                  ouders en beheerders
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  We verzamelen alleen anonieme data (leeftijd, postcode) voor
                  onderzoek
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Namen en exacte gespreksinformatie worden nooit gedeeld
                </span>
              </li>
            </ul>
          </div>

          {/* How it works */}
          <div className="bg-surface border border-border rounded-2xl p-6" style={{backgroundColor: '#baf2d8'}}>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span>⚙️</span>
              Hoe werkt het?
            </h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              Matti gebruikt 9 verschillende thema's om gesprekken te
              organiseren:
            </p>
            <ul className="space-y-2 text-base text-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span>📚</span>
                <span>
                  <strong>School:</strong> Huiswerk, toetsen, schoolstress
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>👥</span>
                <span>
                  <strong>Vrienden:</strong> Vriendschap, ruzie, sociale dingen
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>🏠</span>
                <span>
                  <strong>Thuis:</strong> Familie, ouders, thuissituatie
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>💭</span>
                <span>
                  <strong>Gevoelens:</strong> Emoties, stress, hoe je je voelt
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>❤️</span>
                <span>
                  <strong>Liefde:</strong> Relaties, crushes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>🎮</span>
                <span>
                  <strong>Vrije tijd:</strong> Hobby's, sport, ontspanning
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>🎯</span>
                <span>
                  <strong>Toekomst:</strong> Dromen, plannen
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>🌟</span>
                <span>
                  <strong>Jezelf:</strong> Wie je bent en wilt zijn
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>💬</span>
                <span>
                  <strong>Algemeen:</strong> Voor alles wat je wilt bespreken
                </span>
              </li>
            </ul>
          </div>

          {/* Action & Follow-up */}
          <div className="bg-surface border border-border rounded-2xl p-6" style={{backgroundColor: '#baf2d8'}}>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span>💪</span>
              Actie & Opvolging
            </h2>
            <p className="text-base text-foreground leading-relaxed">
              Matti helpt niet alleen met praten, maar moedigt ook concrete
              acties aan. Na een gesprek kan Matti suggesties doen voor
              praktische stappen. Het systeem volgt automatisch op na een paar
              dagen om te zien hoe het gaat.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-surface border border-border rounded-2xl p-6" style={{backgroundColor: '#baf2d8'}}>
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span>📧</span>
              Vragen of zorgen?
            </h2>
            <p className="text-base text-foreground leading-relaxed">
              Heeft u vragen over Matti of zorgen over het gebruik door uw
              kind? Neem gerust contact met ons op via{" "}
              <a
                href="mailto:info@matti.nl"
                className="text-primary underline hover:opacity-80"
              >
                info@matti.nl
              </a>
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/"
            className="inline-block bg-primary text-white font-bold text-lg px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
          >
            ← Terug naar start
          </a>
        </div>
      </div>
    </div>
  );
}
