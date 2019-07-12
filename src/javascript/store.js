import { createStore } from "redux";

const TOGGLE_SELECT = "TOGGLE_SELECT";
const VIEW_CATEGORY = "VIEW_CATEGORY";
const VIEW_SELECTED = "VIEW_SELECTED";

function toggleSelect(data) {
  return {
    type: TOGGLE_SELECT,
    data
  }
}

function viewCategory(name) {
  return {
    type: VIEW_CATEGORY,
    name
  }
}

function viewSelected(viewing) {
  return {
    type: VIEW_SELECTED,
    viewing
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

      return Object.assign({}, state, {
        loadedPhotos: { 
          ...loadedPhotos, [endpoint]: selectPhoto(state, photoData) }
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

    default:
      return state;
  }
}

function selectPhoto(state, photoData) {
  const endpointPhotos = state.loadedPhotos[photoData.endpoint];
  return endpointPhotos.map(photo => {
    if (photo.id === photoData.id) {
      return { ...photo, selected: !photo.selected };
    } else {
      return photo;
    }
  });
}

const store = createStore(photoApp);
