import '../scss/styles.scss';

(_=> {
  const categories = window.categories || [ "Gala", "Fireworks", "Team-Building Event", "GM Topiary", "SOY Awards" ];
  getById("category-dropdown-button").innerHTML = `${categories[0]} <span class="caret"></span>`;
  populateCategoriesDropDown(categories);
  addListenerToClass("category-name", "click", handleCategoryClick);
})();

function populateCategoriesDropDown(categories) {
  let markup = new String();

  categories.forEach(category => {
    markup += `<li class="category-item"><a class="category-name">${category}</a></li>`;
  });

  return getById("category-list").innerHTML = markup;
}

function handleCategoryClick(event) {
  const categoryName = event.target.innerHTML;

  getById("category-dropdown-button").innerHTML = `${categoryName} <span class="caret"></span>`;

  return true;
}











/*
  HELPER FUNCTIONS
*/

function getById(id) {
  return document.getElementById(id);
}

function scrollToTop() {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function destroyHTML(id) {
  getById(id).innerHTML = new String();
}

function getFromStorage(key) {
  return JSON.parse(window.localStorage.getItem(key));
}

function putInStorage(key, value) {
  return localStorage.setItem(key, JSON.stringify(value));
}

function addListenerToClass(className, event, handler) {
  const elements = document.getElementsByClassName(className);

  Array.from(elements).forEach(element => {
    element.addEventListener(event, handler);
  });

  return true;
}