const ids = [
  "FsxorSNJBaA",
  "J_QpM-k-lW8",
  "HYNXzKU92Qs",
  "Bhn71mwOjsA",
  "nomDXFOCSdg",
  "-X13GINFYOY",
  "NqbOg5ECegE",
  "jv7CHnxEFTk",
  "XbtxooSGPFA",
  "hIFCxzdSGfU",
  "3B5gmNKFqSY",
  "1REMKR646bk",
  "LQaEv6P4ooM",
  "lqdBbTDf1r8",
  "Rj5W40LjspA",
  "sbNc5eL7xNA",
  "8LNYkTVk9BU",
  "W-E6fqoKUrY",
  "DjS0zCfJSZ0",
  "pD1pyFUIgpY",
  "Sqh6rt1hN2A",
  "vb8WJgRAKUU"
];

async function checkTitles() {
  for (const id of ids) {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
      const data = await res.json();
      console.log(`{ id: "${id}", title: "${data.title}" },`);
    } catch (e) {
      console.error(id, e.message);
    }
  }
}

checkTitles();

