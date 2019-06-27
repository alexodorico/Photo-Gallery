import '../scss/styles.scss';
import options from '../../gallery.config';

(async _=> {
  const categories = window.categories || [ "Gala", "Fireworks", "Team-Building Event", "GM Topiary", "SOY Awards" ];
  updateCategoryDropdown(categories[0]);
  populateCategoriesDropDown(categories);
  addListenerToClass("category-name", "click", handleCategoryClick);
  await fetchData(categories[0]);
})();

function populateCategoriesDropDown(categories) {
  let markup = new String();

  categories.forEach(category => {
    markup += `<li class="category-item"><a class="category-name">${category}</a></li>`;
  });

  return getById("category-list").innerHTML = markup;
}

function handleCategoryClick(event) {
  const category = event.target.innerHTML;
  updateCategoryDropdown(category);
  return true;
}

function updateCategoryDropdown(category) {
  return getById("category-dropdown-button").innerHTML = `${category} <span class="caret"></span>`;
}

function fetchData(category = window.categories[0], offset = 0) {
  const endpoint = buildAPICall(category, offset);

  try {
    return fetch(endpoint)
      .then(response => response.json())
      .then(data => handleSuccessfulFetch(data.items))
      .catch(err => showError(err))
  }
  catch {
    showError("Something went wrong while getting photo data");
  }
}

function buildAPICall(category, offset) {
  return `${options.endpoint}job=${window.jobNumber || "GT0000" }&cat=${category}&limit=${options.photoLimit.toString()}&offset=${offset.toString()}`;
}

function handleSuccessfulFetch(data) {
  simplifyData(data);
}

/*
  Only gets necessary data from API results to save
  space in localStorage
  ---
  Recieves array of objects containing photo data
  Returns array of objects containing photo data
*/
function simplifyData(data) {
  return data.map(item => {
    const { id } = item;
    const { embeds: { "AssetOriginalWidth/Height": { url: batchDownloadLink}}} = item;
    const { _links: { download: singleDownloadLink }} = item;
    const { thumbnails: { "600px": { url: thumbnail }}} = item;
    const { file_properties: { image_properties: { aspect_ratio }}} = item;

    return {
      id,
      aspect_ratio,
      thumbnail,
      singleDownloadLink,
      batchDownloadLink
    }
  });
}











/*
  HELPER FUNCTIONS
*/

function getById(id) {
  return document.getElementById(id);
}

function scrollToTop() {
  return document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function destroyHTML(id) {
  return getById(id).innerHTML = new String();
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

function showError(error) {
  return console.log(error);
}