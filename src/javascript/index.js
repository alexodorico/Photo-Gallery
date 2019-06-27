// import './zip';
import '../scss/styles.scss';

function getById(id) {
  return document.getElementById(id);
}

function scrollToTop() {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function destroyHTML(id) {
  getById(id).innerHTML = new String();
}
