var header = document.querySelector(".header");
var headerOpened = "header_open";

var hamburger = document.querySelector(".hamburger");
var headerOpacity = document.querySelector(".header_opacity");
var x = document.querySelector(".x");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    if (header) header.classList.add(headerOpened);
  });
}

if (headerOpacity) {
  headerOpacity.addEventListener("click", () => {
    closeHeader();
  });
}

if (x) {
  x.addEventListener("click", () => {
    closeHeader();
  });
}

function closeHeader() {
  if (header) header.classList.remove(headerOpened);
}
