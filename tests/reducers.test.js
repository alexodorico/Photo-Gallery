import reducer from "../src/javascript/reducers";
import * as types from "../src/javascript/actions";

describe("reducers", () => {
  it("should return initial state", () => {
    expect(reducer(undefined, {})).toEqual({
      selectedCategory: new String(),
      viewingSelected: false,
      categories: new Array(),
      loadedPhotos: new Object()
    });
  });

  it("should change to initial category", () => {
    expect(
      reducer(
        {
          selectedCategory: new String(),
          viewingSelected: false,
          categories: new Array(),
          loadedPhotos: new Object()
        },
        {
          type: types.VIEW_CATEGORY,
          name: "Gala"
        }
      )
    ).toEqual({
      selectedCategory: "Gala",
      viewingSelected: false,
      categories: new Array(),
      loadedPhotos: new Object()
    });
  });

  it("should change category", () => {
    expect(
      reducer(
        {
          selectedCategory: "Fireworks",
          viewingSelected: false,
          categories: new Array(),
          loadedPhotos: new Object()
        },
        {
          type: types.VIEW_CATEGORY,
          name: "Gala"
        }
      )
    ).toEqual({
      selectedCategory: "Gala",
      viewingSelected: false,
      categories: new Array(),
      loadedPhotos: new Object()
    });
  });

  it("should not view selected", () => {
    expect(
      reducer(
        {
          selectedCategory: "Fireworks",
          viewingSelected: true,
          categories: new Array(),
          loadedPhotos: new Object()
        },
        {
          type: types.VIEW_CATEGORY,
          name: "Fireworks"
        }
      )
    ).toEqual({
      selectedCategory: "Fireworks",
      viewingSelected: false,
      categories: new Array(),
      loadedPhotos: new Object()
    });
  });

  it("should view selected", () => {
    expect(
      reducer(
        {
          selectedCategory: "Fireworks",
          viewingSelected: false,
          categories: new Array(),
          loadedPhotos: new Object()
        },
        {
          type: types.VIEW_SELECTED,
          viewing: true
        }
      )
    ).toEqual({
      selectedCategory: "Fireworks",
      viewingSelected: true,
      categories: new Array(),
      loadedPhotos: new Object()
    });
  });

  it("should view selected", () => {
    expect(
      reducer(
        {
          selectedCategory: "Fireworks",
          viewingSelected: false,
          categories: new Array(),
          loadedPhotos: new Object()
        },
        {
          type: types.VIEW_SELECTED,
          viewing: true
        }
      )
    ).toEqual({
      selectedCategory: "Fireworks",
      viewingSelected: true,
      categories: new Array(),
      loadedPhotos: new Object()
    });
  });

  it("should add categories", () => {
    expect(
      reducer(
        {
          selectedCategory: "Fireworks",
          viewingSelected: false,
          categories: new Array(),
          loadedPhotos: new Object()
        },
        {
          type: types.ADD_CATEGORIES,
          categories: ["Gala", "Fireworks", "Test"]
        }
      )
    ).toEqual({
      selectedCategory: "Gala",
      viewingSelected: false,
      categories: ["Gala", "Fireworks", "Test"],
      loadedPhotos: new Object()
    });
  });

  it("should add photo data", () => {
    expect(
      reducer(
        {
          selectedCategory: "Gala",
          viewingSelected: false,
          categories: new Array(),
          loadedPhotos: {
            morley0: [{ test: "data" }, { data: "test" }]
          }
        },
        {
          type: types.ADD_PHOTOS,
          data: [{ test: "data" }, { data: "test" }],
          endpoint: "morley1"
        }
      )
    ).toEqual({
      selectedCategory: "Gala",
      viewingSelected: false,
      categories: new Array(),
      loadedPhotos: {
        morley0: [{ test: "data" }, { data: "test" }],
        morley1: [{ test: "data" }, { data: "test" }]
      }
    });
  });
});
