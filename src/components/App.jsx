import { useState } from 'react'
import "../../public/styles/home.css";

function App() {
  return (
    <div className="app-container">
      <header>
        <a href="../index.html" className="homeLink" aria-label="The Blurry Report Home">
          <h1>THE BLURRY REPORT</h1>
        </a>
      </header>
      <main className="homePage">
        <figure className="homePic-container">
          <img
            className="homePic"
            src="../public/images/bfbg1.png"
            alt="Bigfoot silhouette walking past a sunset"
          />
          
          <figcaption className="tagLine">
            A news aggregate site that focuses on the fringe topics mainstream media would like to ignore...
          </figcaption>
        </figure>
        <div className="buttons">
          <a href="./pages/latest.html">
            <button type="button" className="latest">Latest Chatter...</button>
          </a>
          <a href="./pages/map.html">
            <button type="button" className="map">Unusual Chartography...</button>
          </a>
          <a href="./pages/games.html">
            <button type="button" className="games">Blurry Games...</button>
          </a>
        </div>
      </main>
      <footer>
        <p className="copyright">Copyright © 2025 blurryreport.com</p>
        <nav className="links" aria-label="Footer navigation">
          <a href="./pages/about.html" className="link">About</a>
          <a href="./pages/contact.html" className="link">Contact</a>
          <a href="./pages/archived.html" className="link">Archived</a>
        </nav>
      </footer>
    </div>
  );
}

export default App;

