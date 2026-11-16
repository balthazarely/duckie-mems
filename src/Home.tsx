import duckWineImage from "./images/duck-wine-cropped.jpeg";
import duckDogImage from "./images/duck-dog.jpeg";
import duckKidsImage from "./images/duck-kids.jpeg";

export function Home() {
  return (
    <div className="container">
      <header>
        <img
          src={duckWineImage}
          alt="Anni"
          style={{
            width: "100%",
            maxWidth: "800px",
            marginBottom: "2rem",
            borderRadius: "8px",
          }}
        />
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
          Your “duck” has fled to who knows where and who cares— but I am sure I
          shall enjoy it and if there is a “thereafter” I shall be at the head
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
          }}
          className="image-grid"
        >
          <img
            src={duckDogImage}
            alt="Anni with dog"
            style={{
              width: "100%",
              borderRadius: "8px",
            }}
          />
          <img
            src={duckKidsImage}
            alt="Anni with kids"
            style={{
              width: "100%",
              borderRadius: "8px",
            }}
          />
        </div>
      </header>
    </div>
  );
}
