function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-text">
          <p className="eyebrow">Credit-based skill exchange</p>
          <h1>
            Teach what you know.
            <br />
            Learn what you need.
          </h1>
          <p className="hero-subtext">
            Maharati helps members exchange skills through a credit-based,
            escrow-protected, trust-driven system built for safe learning.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg">Find tutors</button>
            <button className="btn btn-secondary btn-lg">Teach a skill</button>
          </div>
        </div>

        <div className="hero-card">
          <div className="mini-card">
            <span className="mini-label">Protected sessions</span>
            <h3>Escrow locks credits until learning is complete</h3>
          </div>

          <div className="mini-card">
            <span className="mini-label">Trust system</span>
            <h3>Confirmations, disputes, ratings, and reputation</h3>
          </div>

          <div className="mini-card">
            <span className="mini-label">Community growth</span>
            <h3>Learn, teach, and earn value through your skills</h3>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero