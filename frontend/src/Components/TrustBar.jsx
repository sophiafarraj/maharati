function TrustBar() {
  const items = [
    'Credit-based',
    'Escrow protected',
    'Reputation driven',
  ]

  return (
    <section className="trust-bar">
      <div className="container trust-items">
        {items.map((item) => (
          <div key={item} className="trust-pill">
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

export default TrustBar