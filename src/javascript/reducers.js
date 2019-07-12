import {
  TOGGLE_SELECT,
  VIEW_CATEGORY,
  VIEW_SELECTED,
  ADD_PHOTOS,
  ADD_CATEGORIES
} from "./actions";

const initialState = {
  selectedCategory: new String(),
  viewingSelected: false,
  categories: new Array(),
  loadedPhotos: new Object()
}

export function photoApp(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_SELECT:
      const photoId = action.id;
      const endpoint = action.endpoint;
      const selectedPhoto = selectPhoto(state, endpoint, photoId);

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

function selectPhoto(state, endpoint, photoId) {
  const endpointPhotos = state.loadedPhotos[endpoint];

  return endpointPhotos.map(photo => {
    if (photo.id === photoId) {
      return { ...photo, selected: !photo.selected };
    } else {
      return photo;
    }
  });
}
