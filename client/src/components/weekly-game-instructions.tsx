import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyGameInstructions() {
  return (
    <div className="space-y-12 py-8">
      {/* How to Play Section */}
      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">How to play</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold mb-2">Bet</h3>
            <p className="text-muted-foreground">
              Commit $40 to keep<br />you accountable.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="font-semibold mb-2">Lose 4%</h3>
            <p className="text-muted-foreground">
              Over 4 weeks.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="font-semibold mb-2">Win!</h3>
            <p className="text-muted-foreground">
              Split the pot with<br />other winners.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Requirements Section */}
      <section className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>
              <div className="flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              Send our Referees 2 photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <span className="inline-block bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2">1</span>
                  <p>The scale with today's weigh-in<br />word written on a piece of paper.</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <span className="inline-block bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2">2</span>
                  <p>Full-body pose on a scale with<br />lightweight clothing.</p>
                </div>
              </div>
              <div className="bg-muted p-6 rounded-lg">
                <h4 className="font-medium mb-4">What you'll need...</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>a scale</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>pen & paper</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>full-length mirror<br />(or someone to take your photo)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
