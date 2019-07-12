import { createStore } from "redux";

const TOGGLE_SELECT = "TOGGLE_SELECT";
const VIEW_CATEGORY = "VIEW_CATEGORY";
const VIEW_SELECTED = "VIEW_SELECTED";
const ADD_PHOTOS = "ADD_PHOTOS";
const ADD_CATEGORIES = "ADD_CATEGORY";

export function toggleSelect(data) {
  return {
    type: TOGGLE_SELECT,
    data
  }
}

export function viewCategory(name) {
  return {
    type: VIEW_CATEGORY,
    name
  }
}

export function viewSelected(viewing) {
  return {
    type: VIEW_SELECTED,
    viewing
  }
}

export function addPhotos(data, endpoint) {
  return {
    type: ADD_PHOTOS,
    data,
    endpoint
  }
}

export function addCategories(categories) {
  return {
    type: ADD_CATEGORIES,
    categories
  }
}

const initialState = {
  selectedCategory: new String(),
  viewingSelected: false,
  categories: new Array(),
  loadedPhotos: new Object()
}

function photoApp(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_SELECT:
      const photoData = action.data;
      const endpoint = photoData.endpoint;
      const selectedPhoto = selectPhoto(state, photoData);

      return Object.assign({}, state, {
        loadedPhotos: { 
          ...state.loadedPhotos, [endpoint]: selectedPhoto
        }
      });

    case VIEW_CATEGORY:
      return Object.assign({}, state, {
        selectedCategory: action.name,
        viewingSelected: false
      });

    case VIEW_SELECTED:
      return Object.assign({}, state, {
        viewingSelected: true
      });

    case ADD_PHOTOS:
      return Object.assign({}, state, {
        loadedPhotos: { 
          ...state.loadedPhotos, [action.endpoint]: action.data
        }
      });

    case ADD_CATEGORIES:
      return Object.assign({}, state, {
        categories: action.categories,
        selectedCategory: action.categories[0]
      });

    default:
      return state;
  }
}

function selectPhoto(state, photoData) {
  const endpointPhotos = state.loadedPhotos[photoData.endpoint];

  if (typeof endpointPhotos === "undefined") {
    return [{ ...photoData, selected: !photoData.selected }]
  }

  return endpointPhotos.map(photo => {
    if (photo.id === photoData.id) {
      return { ...photo, selected: !photo.selected };
    } else {
      return photo;
    }
  });
}

export const store = createStore(
  photoApp,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
