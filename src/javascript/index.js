import "core-js/stable";
import "regenerator-runtime/runtime";
import "whatwg-fetch";
import "classlist-polyfill";
import dataset from "dataset";
import '../scss/styles.scss';
import options from '../../gallery.config';
import utils from './utils';
import grid from './grid';
import fade from './fade';
import lazy from './lazy';

/*
  IIFE to set up inital state
*/
(async _=> {
  const categories = window.categories || [ "Gala", "Fireworks", "Team-Building Event", "GM Topiary", "SOY Awards" ];
  updateCategoryDropdown(categories[0]);
  populateCategoriesDropDown(categories);
  updateViewSelectedVisibility(utils.getFromStorage("selected"));
  sessionStorage.setItem("viewing-selected", JSON.stringify(false));
  sessionStorage.setItem("current-category", JSON.stringify(categories[0]));
  utils.addListenerToElements(".category-name", "click", handleCategoryClick);
  const photoData = await getData(categories[0]);
  render(null, categories[0], photoData);
})();

function updateCategoryDropdown(category) {
  return utils.getById("category-dropdown-button").innerHTML = `${category} <span class="caret"></span>`;
}

function populateCategoriesDropDown(categories) {
  let markup = new String();
  categories.forEach(category => {
    markup += `<li class="category-item"><a class="category-name">${category}</a></li>`;
  });
  return utils.getById("category-list").innerHTML = markup;
}


function updateViewSelectedVisibility(selectedPhotos) {
  if (selectedPhotos.length) {
    utils.getById("view-selected-button").classList.add("show");
    utils.getById("view-selected-button").addEventListener("click", handleViewSelectedClick);
    
  } else {
    utils.getById("view-selected-button").classList.remove("show");
  }
}

/* 
  Checks for results in localstorage
  If there, renders
  If not, fetches data then renders
*/
async function getData(category = categories[0], offset = 0) {
  const endpoint = buildAPICall(category, offset);
  const cachedResults = utils.getFromStorage(endpoint);

  if (cachedResults) {
    return render(category, cachedResults, offset + 24);
  }

  await fetchData(endpoint);
  const newResults = utils.getFromStorage(endpoint);
  render(category, newResults, offset + 24);
}

function buildAPICall(category = categories[0], offset = 0) {
  return `${options.endpoint}job=${window.jobNumber || "GT0000" }&cat=${category}&limit=${options.photoLimit.toString()}&offset=${offset.toString()}`;
}

function fetchData(endpoint) {
  try {
    return fetch(endpoint)
      .then(response => response.json())
      .then(data => handleSuccessfulFetch(endpoint, data.items))
      .catch(err => utils.showError(err))
  }
  catch {
    return utils.showError("Something went wrong while getting photo data");
  }
}

/*
  Stores simplified data is local storage
*/
function handleSuccessfulFetch(endpoint, data) {
  const simplifiedData = simplifyData(data, endpoint);
  utils.putInStorage(endpoint, simplifiedData);
}

/*
  Only gets necessary data from API results to save space in localStorage
  Recieves array of objects containing photo data
  Returns array of objects containing photo data
*/
function simplifyData(data, endpoint) {
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
      batchDownloadLink,
      selected: false,
      endpoint
    }
  });
}

/*
  Creates photo grid, calulates photo dimensions for each row,
  inserts into DOM, and finally adds listeners.
*/
function render(category = categories[0], photoData, offset) {
  let markup = new String();
  const photoGrid = grid.groupPhotos(photoData);

  try {
    photoGrid.forEach(row => {
      const photoHeight = grid.calculatePhotoHeight(row);

      row.forEach(photo => {
        markup += createPhotoMarkup(photo, photoHeight);
      });
    });
  
    utils.getById("photo-grid").insertAdjacentHTML("beforeend", markup);

    // prevents the whole grid from fading in when more photos are added to view
    offset === 24 ? fadeInInitialCategory(category, offset) : addNewPhotosToCategory(category, offset);
  } catch {
    return;
  }
}

function createPhotoMarkup(photo, photoHeight) {
  return `
  <div>
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
        data-src="${photo.thumbnail}">
      </img>
      <div class="overlay">
      ${createButtonMarkup(photo)}
      </div>
    </div>
  </div>`
}

function createButtonMarkup(photo) {
  return `
    <button
      data-endpoint="${photo.endpoint}"
      type="button"
      data-id="${photo.id}"
      class="btn btn-default select-button ${photo.selected ? 'btn-success' : ''}"
    >
      ${photo.selected ? 'Selected' : 'Select'}
    </button>
    <button class="btn btn-default download-button" >
      <span class="glyphicon glyphicon-download-alt"></span>
    </button>`
}

function fadeInInitialCategory(category, offset) {
  fade.enterMany(".item")
    .then(_ => {
      setUp(category, offset);
    });
}

function addNewPhotosToCategory(category, offset) {
  document.querySelectorAll(".item").forEach(element => {
    element.style.opacity = 1;
  });

  setUp(category, offset);
}

function setUp(category, offset) {
  lazy.setup();
  utils.addListenerToElements(".select-button", "click", handleSelectClick);
  utils.addListenerToElements(".download-button", "click", handleSingleDownloadClick);
  handleScroll(category, offset);
}

/*
  Handles state updates for DOM and data in localstorage
*/
function handleSelectClick(event) {

  // Using dataset polyfill
  let photoArray = utils.getFromStorage(dataset(event.target, "endpoint"));
  let selectedPhoto = findPhotoInLocalStorage(dataset(event.target, "id"), photoArray);

  let selectedPhotosArray = utils.getFromStorage("selected") || false;
  if (!selectedPhotosArray) selectedPhotosArray = new Array();

  selectedPhoto.selected = !selectedPhoto.selected;

  if (selectedPhoto.selected) {
    selectPhoto(selectedPhoto, selectedPhotosArray);
  } else {
    deselectPhoto(selectedPhoto, selectedPhotosArray);
  }

  const updatedPhotoMarkup = createButtonMarkup(selectedPhoto);
  document.querySelector(`[id='${selectedPhoto.id}'] .overlay`).innerHTML = updatedPhotoMarkup;
  document.querySelector(`[id='${selectedPhoto.id}'] .select-button`).addEventListener("click", handleSelectClick);

  // Using dataset polyfill
  utils.putInStorage(dataset(event.target, "endpoint"), photoArray);
  return updateViewSelectedVisibility(selectedPhotosArray);
}

function findPhotoInLocalStorage(selectedPhotoId, photoArray) {
  for (let i = 0; i < photoArray.length; i++) {
    if (photoArray[i].id === selectedPhotoId) {
      return photoArray[i];
    }
  }
  return;
}

function selectPhoto(selectedPhoto, selectedPhotos) {
  selectedPhotos.unshift(selectedPhoto);
  return utils.putInStorage("selected", selectedPhotos);
}

function deselectPhoto(selectedPhoto, selectedPhotosArray) {
  for (let i = 0; i < selectedPhotosArray.length; i++) {
    if (selectedPhotosArray[i].id === selectedPhoto.id) {
      let start = i, end = i;
      if (i === 0) end++;
      selectedPhotosArray.splice(start, end);
      utils.putInStorage("selected", selectedPhotosArray);
      break;
    }
  }

  checkForRedirect(selectedPhotosArray);
}

function checkForRedirect(selectedPhotoArray) {
  const viewingSelected = JSON.parse(sessionStorage.getItem("viewing-selected"));
  
  if (viewingSelected && !selectedPhotoArray.length) {
    const previousCategory = JSON.parse(sessionStorage.getItem("current-category"));
    const endpoint = buildAPICall(previousCategory, 0);
    const itemsToRender = utils.getFromStorage(endpoint);
    utils.destroyHTML("photo-grid");
    utils.scrollToTop();
    sessionStorage.setItem("viewing-selected", JSON.stringify(false));
    render(previousCategory, itemsToRender, 0);
  }
}

function handleViewSelectedClick() {
  const selectedPhotos = utils.getFromStorage("selected");
  $(window).off('scroll');
  utils.destroyHTML("photo-grid");
  utils.scrollToTop();
  sessionStorage.setItem("viewing-selected", JSON.stringify(true));
  render(null, selectedPhotos, null);
}

function handleScroll(category, offset) {
  $(window).scroll(function() {
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 500) {
      $(window).off('scroll');
      getData(category, offset)
    }
  });
}

function handleSingleDownloadClick(e) {
  e.preventDefault();
  var downloadLink = $(this).parents('.item').attr('singleDownloadLink');
  $('#dl-frame').attr("src", downloadLink);
}

function handleCategoryClick(event) {
  const category = event.target.innerHTML;
  $(window).off('scroll');
  fade.outMany(".item")
    .then(_ => {
      utils.destroyHTML('photo-grid');
      getData(category, 0);
    });
  utils.scrollToTop();
  sessionStorage.setItem("viewing-selected", JSON.stringify(false));
  sessionStorage.setItem("current-category", JSON.stringify(category));
  return updateCategoryDropdown(category);
}
