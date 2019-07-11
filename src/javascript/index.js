import '../scss/styles.scss';
import fade from './fade';
import lazy from './lazy';
import options from '../../gallery.config';


/*
  IIFE to set up application
*/
(async _=> {
  const categories = window.categories || [ "Gala", "Fireworks", "Team-Building Event", "GM Topiary", "SOY Awards" ];
  updateCategoryDropdown(categories[0]);
  populateCategoriesDropDown(categories);
  updateViewSelectedVisibility(getFromStorage("selected"));
  addListenerToElements(".category-name", "click", handleCategoryClick);
  const photoData = await getData(categories[0]);
  render(null, categories[0], photoData);
})();

function fetchData(endpoint) {
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

/* 
  Checks for results in localstorage
  If there, renders
  If not, fetches data
*/
async function getData(category = categories[0], offset = 0) {
  const endpoint = buildAPICall(category, offset);
  const cachedResults = getFromStorage(endpoint);

  if (cachedResults) {
    return render(endpoint, category, cachedResults, offset + 24);
  }

  await fetchData(endpoint);
  const newResults = getFromStorage(endpoint);
  render(endpoint, category, newResults, offset + 24);
}

/*
  Creates photo grid, calulates photo dimensions for each row,
  inserts into DOM, and finally adds listeners.
*/
function render(endpoint, category = categories[0], photoData, offset) {
  let markup = new String();
  const grid = groupPhotos(photoData);

  try {
    grid.forEach(row => {
      const photoHeight = calculatePhotoHeight(row);

      row.forEach(photo => {
        markup += createPhotoMarkup(photo, photoHeight);
      });
    });
  
    getById("photo-grid").insertAdjacentHTML("beforeend", markup);

    // prevents the whole grid from fading in when more photos are added to view
    offset === 24 ? fadeInInitialCategory(category, offset) : addNewPhotosToCategory(category, offset);
  } catch {
    return;
  }
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
  addListenerToElements(".select-button", "click", handleSelectClick);
  addListenerToElements(".download-button", "click", handleSingleDownloadClick);
  handleScroll(category, offset);
}

/*
  Handles state updates for DOM and data in localstorage
  TODO: make better comments and variable names
*/
function handleSelectClick(event) {
  let photoArray = getFromStorage(event.target.dataset.endpoint);
  let selectedPhoto = findPhotoInLocalStorage(event.target.dataset.id, photoArray);
  let selectedPhotosArray = getFromStorage("selected") || false;
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

  putInStorage(event.target.dataset.endpoint, photoArray);
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

function updateViewSelectedVisibility(selectedPhotos) {
  if (selectedPhotos.length) {
    getById("view-selected-button").classList.add("show");
    getById("view-selected-button").addEventListener("click", handleViewSelectedClick);
    
  } else {
    getById("view-selected-button").classList.remove("show");
  }
}

function selectPhoto(selectedPhoto, selectedPhotos) {
  selectedPhotos.unshift(selectedPhoto);
  return putInStorage("selected", selectedPhotos);
}

function deselectPhoto(selectedPhoto, selectedPhotosArray) {
  for (let i = 0; i < selectedPhotosArray.length; i++) {
    if (selectedPhotosArray[i].id === selectedPhoto.id) {
      let start = i, end = i;
      if (i === 0) end++;
      selectedPhotosArray.splice(start, end);
      return putInStorage("selected", selectedPhotosArray);
    }
  }
}

function handleViewSelectedClick() {
  const selectedPhotos = getFromStorage("selected");
  console.log(selectedPhotos);
  destroyHTML("photo-grid");
  render(null, null, selectedPhotos, null);
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

function addAspectRatios(photoRow, update) {
  let aspectRatio = 0;

  photoRow.forEach(photo => {
    aspectRatio += photo.aspect_ratio;
  });

  return aspectRatio;
}

function computeSpaceInRow(photoRow) {
  let availableSpace = options.containerWidth - options.containerPadding - options.photoMargin * options.rowLength;

  if (photoRow.length !== options.rowLength) {
    availableSpace += (options.rowLength - photoRow.length) * options.photoMargin;
  }

  return availableSpace;
}

function groupPhotos(data) {
  let photoGrid = new Array();
  
  try {
    for (let i = 0; i < data.length / options.rowLength; i++) {
      const photoRow = data.slice(options.rowLength * i, options.rowLength * i + options.rowLength);
      photoGrid.push(photoRow);
    }
  
    return photoGrid;
  } catch {
    return;
  }
}

function calculatePhotoHeight(row) {
  const aspectRatio = addAspectRatios(row);
  const spaceInRow = computeSpaceInRow(row);
  const photoHeight = spaceInRow / aspectRatio;
  return photoHeight;
}

function handleScroll(category, offset) {
  $(window).scroll(function() {
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 500) {
      console.log('triggered');
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
  return JSON.parse(window.localStorage.getItem(key)) || false;
}

function putInStorage(key, value) {
  return localStorage.setItem(key, JSON.stringify(value));
}

function buildAPICall(category = categories[0], offset = 0) {
  return `${options.endpoint}job=${window.jobNumber || "GT0000" }&cat=${category}&limit=${options.photoLimit.toString()}&offset=${offset.toString()}`;
}

function handleSuccessfulFetch(endpoint, data) {
  const simplifiedData = simplifyData(data, endpoint);
  putInStorage(endpoint, simplifiedData);
}

function handleCategoryClick(event) {
  const category = event.target.innerHTML;
  $(window).off('scroll');
  fade.outMany(".item")
    .then(_ => {
      destroyHTML('photo-grid');
      getData(category, 0);
    });
  scrollToTop();
  return updateCategoryDropdown(category);
}

function updateCategoryDropdown(category) {
  return getById("category-dropdown-button").innerHTML = `${category} <span class="caret"></span>`;
}

function addListenerToElements(query, event, handler) {
  const elements = document.querySelectorAll(query);

  Array.from(elements).forEach(element => {
    element.addEventListener(event, handler);
  });

  return true;
}

function showError(e) {
  return console.log(e);
}
