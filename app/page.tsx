import Image from 'next/image'

export default function Home() {
  return (
    <div className="container">
      <header>
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', marginBottom: '2rem' }}>
          <Image
            src="/duck-wine-cropped.jpeg"
            alt="Anni"
            width={800}
            height={600}
            priority
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "8px",
              display: 'block',
            }}
          />
        </div>
        <h1>Anni Wilson </h1>
        <div className="dates">3/06/38 - 11/11/26</div>
        <h2 className="tribute">JUST...</h2>
        <p className="tribute">
          Remember me in the rising sun and the glorious sunsets that I enjoyed
          so much: the scotch, music, operas, laughter and tears: my slapdash
          nature and the love of the ridiculous. <br /> <br />
          Gardening, hands in the dirt, smell of lavender, apple trees, fresh
          veggies, parsley, coriander, kale, the things of life that money
          cannot buy. Beautiful birds, the surf, the boats, swimming, fishing,
          amazing family and precious friends, pets that have enriched our
          lives— everything that was so important to me. <br /> <br />
          Your "duck" has fled to who knows where and who cares— but I am sure I
          shall enjoy it and if there is a "thereafter" I shall be at the head
          of the queue waiting to embrace you!
        </p>
        <br />
        <p>Anni (duck)</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginTop: "2rem",
            marginBottom: "2rem",
          }}
          className="image-grid"
        >
          <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
            <Image
              src="/duck-dog.jpeg"
              alt="Anni with dog"
              fill
              style={{
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </div>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
            <Image
              src="/duck-kids.jpeg"
              alt="Anni with kids"
              fill
              style={{
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <a
            href="/annis-farewell.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "transparent",
              color: "#333",
              padding: "0.8rem 1.5rem",
              borderRadius: "4px",
              border: "1px solid #333",
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            <img
              src="/duck_image.png"
              alt="Duck"
              style={{
                height: "20px",
                width: "auto",
              }}
            />
            Print Version
          </a>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <a
            href="/messages"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "#333",
              color: "white",
              padding: "0.8rem 1.5rem",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            <img
              src="/duck_image.png"
              alt="Duck"
              style={{
                height: "20px",
                width: "auto",
                filter: "brightness(0) invert(1)",
              }}
            />
            Share a Memory
          </a>
        </div>
      </header>
    </div>
  );
}
