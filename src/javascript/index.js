import '../scss/styles.scss';
import options from '../../gallery.config';

(async _=> {
  const categories = window.categories || [ "Gala", "Fireworks", "Team-Building Event", "GM Topiary", "SOY Awards" ];
  updateCategoryDropdown(categories[0]);
  populateCategoriesDropDown(categories);
  addListenerToClass("category-name", "click", handleCategoryClick);
  await fetchData(categories[0]);
  render(categories[0]);
})();

function fetchData(category = window.categories[0], offset = 0) {
  const endpoint = buildAPICall(category, offset);

  try {
    return fetch(endpoint)
      .then(response => response.json())
      .then(data => handleSuccessfulFetch(endpoint, data.items))
      .catch(err => showError(err))
  }
  catch {
    return showError("Something went wrong while getting photo data");
  }
}

function render(category = categories[0], offset = 0) {
  let markup = new String();
  const key = buildAPICall(category, offset);
  const data = getFromStorage(key);
  const grid = groupPhotos(data);

  grid.forEach(row => {
    const aspectRatio = addAspectRatios(row);
    const spaceInRow = computeSpaceInRow(row);
    const photoHeight = spaceInRow / aspectRatio;
    const photoWidth = photoHeight * aspectRatio;

    markup += buildMarkup(row, photoHeight, photoWidth);
  });

  destroyHTML("photo-grid");
  getById("photo-grid").insertAdjacentHTML("beforeend", markup);
}

function buildMarkup(row, photoHeight, photoWidth) {
  var markup = new String();

  row.forEach(function(photo) {
    markup += `
    <div class="item"
       id="${photo.id}"
       downloadLink="${photo.batchDownloadLink}"
       singleDownloadLink="${photo.singleDownloadLink}"
       style="width: ${photoHeight * photo.aspect_ratio + 'px'}">
      <div class="loader"></div>
      <img
        class="lazy"
        data-original-src="${photo.batchDownloadLink}"
        height="${photoHeight}"
        width="${photoHeight * photo.aspect_ratio}"
        src=""
        data-src="${photo.thumbnail}">
      </img>
      <div class="overlay">
        <button type="button" class="btn btn-default select-button">
          Select 
        </button>
        <button class="btn btn-default download-button">
          <span class="glyphicon glyphicon-download-alt"></span>
        </button>
      </div>
    </div>`
  });

  return markup;
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////  HELPER FUNCTIONS  //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

// This doesn't really need to be a function, only used once
function populateCategoriesDropDown(categories) {
  let markup = new String();

  categories.forEach(category => {
    markup += `<li class="category-item"><a class="category-name">${category}</a></li>`;
  });

  return getById("category-list").innerHTML = markup;
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

function addAspectRatios(photoRow, update) {
  let aspectRatio = 0;

  photoRow.forEach(photo => {
    aspectRatio += photo.aspect_ratio;
  });

  return aspectRatio;
}

function computeSpaceInRow(photoRow) {
  const availableSpace = options.containerWidth - options.containerPadding - options.photoMargin * options.rowLength;

  if (photoRow.length !== options.rowLength) {
    availableSpace += (options.rowLength - photoRow.length) * options.photoMargin;
  }

  return availableSpace;
}

function groupPhotos(data) {
  let photoGrid = new Array();

  for (let i = 0; i < data.length / options.rowLength; i++) {
    const photoRow = data.slice(options.rowLength * i, options.rowLength * i + options.rowLength);
    photoGrid.push(photoRow);
  }

  return photoGrid;
}

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

function buildAPICall(category = categories[0], offset = 0) {
  return `${options.endpoint}job=${window.jobNumber || "GT0000" }&cat=${category}&limit=${options.photoLimit.toString()}&offset=${offset.toString()}`;
}

function handleSuccessfulFetch(endpoint, data) {
  const simplifiedData = simplifyData(data);
  putInStorage(endpoint, simplifiedData);
}

function handleCategoryClick(event) {
  const category = event.target.innerHTML;
  return updateCategoryDropdown(category);
}

function updateCategoryDropdown(category) {
  return getById("category-dropdown-button").innerHTML = `${category} <span class="caret"></span>`;
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