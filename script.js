
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const items = [...document.querySelectorAll("#newsList article")];
let start = 0;

function renderNews() {
  items.forEach((item, index) => {
    item.classList.toggle("hidden", index !== start);
  });
}

document.querySelector("#newsNext").addEventListener("click", () => {
  start = (start + 1) % items.length;
  renderNews();
});

document.querySelector("#newsPrev").addEventListener("click", () => {
  start = (start - 1 + items.length) % items.length;
  renderNews();
});

renderNews();

document.querySelector(".contact-form").addEventListener("submit", event => {
  event.preventDefault();
  alert("Form hazır. Mesaj göndermek için Formspree veya başka bir form servisi bağlayın.");
});
