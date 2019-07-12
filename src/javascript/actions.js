export const TOGGLE_SELECT = "TOGGLE_SELECT";
export const VIEW_CATEGORY = "VIEW_CATEGORY";
export const VIEW_SELECTED = "VIEW_SELECTED";
export const ADD_PHOTOS = "ADD_PHOTOS";
export const ADD_CATEGORIES = "ADD_CATEGORY";

export function toggleSelect(endpoint, id) {
  return {
    type: TOGGLE_SELECT,
    endpoint,
    id
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
