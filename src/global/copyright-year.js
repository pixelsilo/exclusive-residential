export default function copyrightYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[copyright="year"]').forEach((el) => {
    el.textContent = year;
  });
}
