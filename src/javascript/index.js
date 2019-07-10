import '../scss/styles.scss';
import options from '../../gallery.config';

/*
  IIFE to set up application
*/
(async _=> {
  const categories = window.categories || [ "Gala", "Fireworks", "Team-Building Event", "GM Topiary", "SOY Awards" ];
  updateCategoryDropdown(categories[0]);
  populateCategoriesDropDown(categories);
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
        markup += createPhotoMarkup(endpoint, photo, photoHeight);
      });
    });
  
    getById("photo-grid").insertAdjacentHTML("beforeend", markup);
    lazyLoadSetUp();
    addListenerToElements(".select-button", "click", handleSelectClick)
    handleScroll(category, offset);
  } catch {
    return;
  }
}

/*
  Handles state updates for DOM and data in localstorage
*/
function handleSelectClick(event) {
  let selectedPhoto = JSON.parse(this.dataset.photo);
  let selectedPhotos = getFromStorage("selected") || false;
  let selected = this.dataset.selected;

  updateState(event);

  if (!selectedPhotos) selectedPhotos = new Array();

  if (selected === "false") {
    selectPhoto(selectedPhoto, selectedPhotos, event);
  } else {
    deselectPhoto(selectedPhoto, selectedPhotos, event);
  }

  return updateViewSelectedVisibility(selectedPhotos);
}

function updateState(event) {
  console.log(event.target.dataset.endpoint)
  let photoData = getFromStorage(event.target.dataset.endpoint);

  console.log(photoData);
  
  photoData.forEach(photo => {
    if (photo.id === event.target.dataset.id) {
      return photo.selected = !photo.selected;
    }
  });

  putInStorage(event.target.dataset.endpoint, photoData);
}

function updateViewSelectedVisibility(selectedPhotos) {
  if (selectedPhotos.length) {
    getById("view-selected-button").classList.add("show");
    getById("view-selected-button").addEventListener("click", handleViewSelectedClick);
    
  } else {
    getById("view-selected-button").classList.remove("show");
  }
}

function selectPhoto(selectedPhoto, selectedPhotos, event) {
  selectedPhoto.selected = true;
  selectedPhotos.push(selectedPhoto);
  event.target.classList.add('btn-success');
  event.target.innerHTML = "Selected";
  event.target.dataset.selected = "true";
  return putInStorage("selected", selectedPhotos);
}

function deselectPhoto(selectedPhoto, selectedPhotos, event) {
  selectedPhoto.selected = false;
  event.target.classList.remove('btn-success');
  event.target.innerHTML = "Select";
  event.target.dataset.selected = "false";
  selectedPhotos.forEach((photo, index) => {
    if (photo.id === selectedPhoto.id) {
      let start = index, end = index;
      if (index === 0) end++;
      selectedPhotos.splice(start, end)
      return putInStorage("selected", selectedPhotos);
    }
  });
}

function handleViewSelectedClick() {
  const selectedPhotos = getFromStorage("selected");
  console.log(selectedPhotos);
  destroyHTML("photo-grid");
  render(null, null, selectedPhotos, null);
}

function createPhotoMarkup(endpoint, photo, photoHeight) {
  return `
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
        <button
          data-photo='${JSON.stringify(photo)}'
          type="button"
          data-id="${photo.id}"
          data-selected="${photo.selected}"
          class="btn btn-default select-button ${photo.selected ? 'btn-success' : ''}"
        >
          ${photo.selected ? 'Selected' : 'Select'}
        </button>
        <button class="btn btn-default download-button" >
          <span class="glyphicon glyphicon-download-alt"></span>
        </button>
      </div>
    </div>`
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

function lazyLoadSetUp() {
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  var active = false;

  if ('IntersectionObserver' in window) {
    var lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    var lazyLoad = function() {
      if (active === false) {
        active = true;

        setTimeout(function() {
          lazyImages.forEach(function(lazyImage) {
            if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== "none") {
              lazyImage.src = lazyImage.getAttribute('data-src');
              if (lazyImage.classList) {
                lazyImage.classList.remove('lazy');
              } else {
                lazyImage.className.replace(/\bblazy\b/g, "");
              }
              
              lazyImages = lazyImages.filter(function(image) {
                return image !== lazyImage;
              });

              if (lazyImage.length === 0) {
                document.removeEventListener('scroll', lazyLoad);
                window.removeEventListener('resize', lazyLoad);
                window.removeEventListener('orientationchange', lazyLoad);
              }
            }
          });

          active = false;
        }, 200);

      }
    };

    document.addEventListener('scroll', lazyLoad);
    window.addEventListener('resize', lazyLoad);
    window.addEventListener('orientationchange', lazyLoad);
    window.scroll(0,window.scrollY + 1);
    window.scroll(0,window.scrollY - 1);
  }
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
  destroyHTML('photo-grid');
  getData(category, 0);
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
