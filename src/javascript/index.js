import "core-js/stable";
import "regenerator-runtime/runtime";
import "whatwg-fetch";
import "classlist-polyfill";
import dataset from "dataset";
import createZip from "./modules/zip";
import PhotoSwipe from "photoswipe";
import PhotoSwipeUI_Default from "../../node_modules/photoswipe/dist/photoswipe-ui-default";
import DragSelect from "dragselect";
import "../../node_modules/photoswipe/dist/photoswipe.css";
import "../../node_modules/photoswipe/dist/default-skin/default-skin.css";
import "../../node_modules/photoswipe/dist/default-skin/default-skin.png";
import "../../node_modules/photoswipe/dist/default-skin/default-skin.svg";
import "../scss/styles.scss";
import options from "../../gallery.config";
import utils from "./modules/utils";
import grid from "./modules/grid";
import fade from "./modules/fade";
import lazy from "./modules/lazy";
import { store } from "./store";
import {
  toggleSelect,
  viewCategory,
  viewSelected,
  addPhotos,
  addCategories
} from "./actions";

/*
  IIFE to set up inital state
*/
(_ => {
  const categories = window.categories || [
    "Fireworks",
    "Gala",
    "Team-Building Event",
    "GM Topiary",
    "SOY Awards"
  ];

  getCachedData();

  store.dispatch(addCategories(categories));

  const initCategory = store.getState().categories[0];

  updateCategoryDropdown(initCategory);
  populateCategoriesDropDown(store.getState().categories);

  utils.addListenerToElements(".category-name", "click", handleCategoryClick);
  utils.getById("download-zip").addEventListener("click", handleDownloadClick);

  getData(initCategory);
})();

function updateCategoryDropdown(category) {
  return (utils.getById(
    "category-dropdown-button"
  ).innerHTML = `${category} <span class="caret"></span>`);
}

function populateCategoriesDropDown(categories) {
  let markup = new String();
  categories.forEach(category => {
    markup += `<li class="category-item"><a class="category-name">${category}</a></li>`;
  });
  return (utils.getById("category-list").innerHTML = markup);
}

/* 
  If there's photo data cached, put it in the store
*/
function getCachedData() {
  for (const key in localStorage) {
    if (key.includes("morley")) {
      store.dispatch(addPhotos(JSON.parse(localStorage.getItem(key)), key));
    }
  }
}

/*
  Checks for results in localstorage
  If there, renders
  If not, fetches data then renders
*/
async function getData(category = categories[0], offset = 0) {
  const endpoint = buildAPICall(category, offset);
  const cachedResults = store.getState().loadedPhotos[endpoint];

  if (cachedResults) {
    return render(category, cachedResults, offset + 24);
  }

  await fetchData(endpoint);
  const newResults = store.getState().loadedPhotos[endpoint];
  render(category, newResults, offset + 24);
}

function buildAPICall(category = categories[0], offset = 0) {
  return `${options.endpoint}job=${window.jobNumber ||
    "GT0000"}&cat=${category}&limit=${
    options.photoLimit
  }&offset=${offset.toString()}`;
}

function fetchData(endpoint) {
  try {
    return fetch(endpoint)
      .then(response => response.json())
      .then(data => handleSuccessfulFetch(endpoint, data.items))
      .catch(err => utils.showMessage(err, "alert-danger"));
  } catch {
    return utils.showMessage(
      "Something went wrong while getting photo data",
      "alert-danger"
    );
  }
}

/*
  Stores simplified data in local storage
  and sends to store
*/
function handleSuccessfulFetch(endpoint, data) {
  const simplifiedData = simplifyData(data, endpoint);

  store.dispatch(addPhotos(simplifiedData, endpoint));
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
    const {
      embeds: {
        "AssetOriginalWidth/Height": { url: batchDownloadLink }
      }
    } = item;
    const {
      _links: { download: singleDownloadLink }
    } = item;
    const {
      thumbnails: {
        "600px": { url: thumbnail }
      }
    } = item;
    const {
      file_properties: {
        image_properties: { aspect_ratio, width, height }
      }
    } = item;

    return {
      id,
      aspect_ratio,
      width,
      height,
      thumbnail,
      singleDownloadLink,
      batchDownloadLink,
      selected: false,
      endpoint
    };
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
    offset === 24
      ? fadeInInitialCategory(category, offset)
      : addNewPhotosToCategory(category, offset);
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
       style="width: ${photoHeight * photo.aspect_ratio + "px"}">
      <div class="loader"></div>
      <img
        class="lazy"
        data-original-src="${photo.batchDownloadLink}"
        data-original-width="${photo.width}"
        data-original-height="${photo.height}"
        data-endpoint="${photo.endpoint}"
        height="${photoHeight}"
        width="${photoHeight * photo.aspect_ratio}"
        data-src="${photo.thumbnail}">
      </img>
      <div class="overlay">
      ${createButtonMarkup(photo)}
      </div>
    </div>
  </div>`;
}

function createButtonMarkup(photo) {
  return `
    <button
      data-endpoint="${photo.endpoint}"
      type="button"
      data-id="${photo.id}"
      class="btn btn-default select-button ${
        photo.selected ? "btn-success" : ""
      }"
    >
      ${photo.selected ? "Selected" : "Select"}
    </button>
    <button class="btn btn-default download-button" >
      <span class="glyphicon glyphicon-download-alt"></span>
    </button>`;
}

function fadeInInitialCategory(category, offset) {
  fade.enterMany(".item").then(_ => {
    photoInsertionCleanup(category, offset);
  });
}

function addNewPhotosToCategory(category, offset) {
  document.querySelectorAll(".item").forEach(element => {
    element.style.opacity = 1;
  });

  photoInsertionCleanup(category, offset);
}

/* 
  Adds event listeners to photos inserted into DOM
*/
function photoInsertionCleanup(category, offset) {
  lazy.setup();

  new DragSelect({
    selectables: document.querySelectorAll("img"),
    callback: dragSelectCallback
  });

  utils.addListenerToElements(".select-button", "click", handleSelectClick);
  utils.addListenerToElements(
    ".download-button",
    "click",
    handleSingleDownloadClick
  );
  utils.addListenerToElements("img", "click", lightboxInit);
  handleScroll(category, offset);
}

/*
  1. Tells store that there's been an update
  2. Creates new button markup depending on if the photo
     has been selected or deselected
  3. Adds event listener 
  4. If it's the last photo deselected when viewing selected,
     take user back to the last viewed category
*/
function handleSelectClick(event) {
  const endpoint = dataset(event.target, "endpoint");
  const photoId = dataset(event.target, "id");

  store.dispatch(toggleSelect(endpoint, photoId));

  let selectedPhoto = findPhotoInEndpointData(photoId, endpoint);
  const updatedPhotoMarkup = createButtonMarkup(selectedPhoto);

  document.querySelector(
    `[id='${selectedPhoto.id}'] .overlay`
  ).innerHTML = updatedPhotoMarkup;

  document
    .querySelector(`[id='${selectedPhoto.id}'] .select-button`)
    .addEventListener("click", handleSelectClick);

  const selectedPhotos = getSelected();
  updateViewSelectedVisibility(selectedPhotos.length);

  if (selectedPhotos.length === 0 && store.getState().viewingSelected) {
    redirect();
  }
}

/*
  Returns photo data after searching for it in the store
  by endpoint and id
*/
function findPhotoInEndpointData(id, endpoint) {
  const endpointPhotos = store.getState().loadedPhotos[endpoint];
  for (let i = 0; i < endpointPhotos.length; i++) {
    if (endpointPhotos[i].id === id) {
      return endpointPhotos[i];
    }
  }
  return false;
}

/*
  Searches photos in store for selected photos
  Returns an array of selected photos
*/
function getSelected() {
  const loadedPhotos = store.getState().loadedPhotos;
  let selectedPhotos = new Array();

  for (let endpoint in loadedPhotos) {
    loadedPhotos[endpoint].forEach(photo => {
      if (photo.selected) selectedPhotos.push(photo);
    });
  }
  return selectedPhotos;
}

/* 
  If photos are selected, let user view them
*/
function updateViewSelectedVisibility(selectedPhotos) {
  if (selectedPhotos) {
    utils.getById("view-selected-button").classList.remove("hide");
    utils
      .getById("view-selected-button")
      .addEventListener("click", handleViewSelectedClick);
  } else {
    utils.getById("view-selected-button").classList.add("hide");
  }
}

function redirect() {
  const previousCategory = store.getState().selectedCategory;
  const endpoint = buildAPICall(previousCategory, 0);
  const itemsToRender = utils.getFromStorage(endpoint);

  utils.destroyHTML("photo-grid");
  utils.scrollToTop();
  store.dispatch(viewSelected(false));
  render(previousCategory, itemsToRender, 0);
}

function handleViewSelectedClick() {
  const selectedPhotos = getSelected();
  $(window).off("scroll");
  utils.destroyHTML("photo-grid");
  store.dispatch(viewSelected(true));
  render(null, selectedPhotos, null);
  utils.scrollToTop();
}

/* 
  When user is 500px from bottom, get more photo data
*/
function handleScroll(category, offset) {
  $(window).scroll(function() {
    if (
      $(window).scrollTop() >=
      $(document).height() - $(window).height() - 500
    ) {
      $(window).off("scroll");
      getData(category, offset);
    }
  });
}

function handleSingleDownloadClick(e) {
  e.preventDefault();
  var downloadLink = $(this)
    .parents(".item")
    .attr("singleDownloadLink");
  $("#dl-frame").attr("src", downloadLink);
}

function handleCategoryClick(event) {
  const category = event.target.innerHTML;
  $(window).off("scroll");

  fade.outMany(".item").then(_ => {
    utils.destroyHTML("photo-grid");
    getData(category, 0);
  });

  utils.scrollToTop();
  store.dispatch(viewSelected(false));
  store.dispatch(viewCategory(category));
  return updateCategoryDropdown(category);
}

/*
  Downloads ZIP file of selected photos
*/
function handleDownloadClick() {
  let selectedPhotos = getSelected();
  selectedPhotos = selectedPhotos.map(photo => photo.batchDownloadLink);
  createZip(selectedPhotos, "Selected Photos");
}

/*
  handleSelectClick takes in an event as it's first argument
  when the select button is clicked.
  In the forEach statement I'm mocking an event object so I don't
  have to change that function as it's needed as is for single clicks
*/
function dragSelectCallback(e) {
  e.forEach(image => {
    const button = image.nextElementSibling.firstElementChild;
    const event = { target: button };
    handleSelectClick(event);
  });
}

function lightboxInit(e) {
  let pswpElement = document.querySelectorAll(".pswp")[0];
  let lightboxPhotos = [];
  let $items = $(".item");
  let element = e.target.parentElement.parentElement;
  let i = 0;
  let options = {
    index: 0,

    // Zooms image in/out
    getThumbBoundsFn: function(index) {
      let thumbnail = document.querySelectorAll(".item")[index];
      let pageYScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      let rect = thumbnail.getBoundingClientRect();
      return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
    }
  };

  // Get's position of clicked photo
  while (element.previousElementSibling != null) {
    element = element.previousElementSibling;
    i++;
  }

  options.index = i;

  // Need to declare photo height and width for lightbox
  for (let i = 0; i < $items.length; i++) {
    let item = {};
    item.src = $items[i].children[1].getAttribute("data-original-src");
    item.w = $items[i].children[1].getAttribute("data-original-width");
    item.h = $items[i].children[1].getAttribute("data-original-height");
    lightboxPhotos.push(item);
  }

  let gallery = new PhotoSwipe(
    pswpElement,
    PhotoSwipeUI_Default,
    lightboxPhotos,
    options
  );
  gallery.init();
}
